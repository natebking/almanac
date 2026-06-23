import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { DEMO_USER_COOKIE } from "@/lib/demo-cookie";
import { getEnv, isAllowedUserEmail } from "@/lib/env";
import { seedSamplePortfolio } from "../../prisma/seed";

// The shared fallback user is only used by clients with no per-visitor cookie
// (tests, bots, curl) so the app still works without one.
const SHARED_DEMO_EMAIL = "alpha-user@example.com";
const DEMO_USER_NAME = "Monty Banks";

export async function getAlphaUser() {
  return getCurrentUser();
}

export async function getCurrentUser() {
  const env = getEnv();

  if (env.AUTH_MODE === "clerk") {
    return getClerkUser();
  }

  return getAlphaUserRecord();
}

async function getAlphaUserRecord() {
  const db = await getDb();
  const demoId = await readDemoUserId();

  // No per-visitor cookie: fall back to a single shared demo user, populated
  // lazily so even cookieless clients see a real portfolio.
  if (!demoId) {
    const shared = await db.user.upsert({
      where: { email: SHARED_DEMO_EMAIL },
      update: {},
      create: { email: SHARED_DEMO_EMAIL, name: DEMO_USER_NAME },
    });
    await ensurePortfolio(db, shared.id);
    return shared;
  }

  const existing = await db.user.findUnique({ where: { id: demoId } });
  if (existing) {
    return existing;
  }

  // First visit for this browser: create a private sandbox and clone the
  // sample portfolio into it so the visitor lands on a populated demo.
  try {
    const user = await db.user.create({
      data: { id: demoId, name: DEMO_USER_NAME },
    });
    await ensurePortfolio(db, user.id);
    return user;
  } catch {
    // A concurrent first request already created this sandbox; reuse it.
    const raced = await db.user.findUnique({ where: { id: demoId } });
    if (raced) {
      return raced;
    }
    throw new Error("Could not resolve the demo user.");
  }
}

// Clone the sample portfolio into a sandbox once. Safe to call repeatedly: it
// only seeds when the sandbox is empty, and swallows the unique-constraint
// error from a concurrent first request.
async function ensurePortfolio(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: string,
) {
  const seeded = await db.propertyIndex.count({ where: { userId } });
  if (seeded > 0) {
    return;
  }
  try {
    await seedSamplePortfolio(db, userId);
  } catch (error) {
    console.error("Demo sandbox seed failed", error);
  }
}

async function readDemoUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(DEMO_USER_COOKIE)?.value ?? null;
  } catch {
    // cookies() throws outside a request scope; treat as no cookie.
    return null;
  }
}

async function getClerkUser() {
  const env = getEnv();
  const [{ currentUser }, db] = await Promise.all([
    import("@clerk/nextjs/server"),
    getDb(),
  ]);
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Authentication required.");
  }

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses.at(0)?.emailAddress ??
    null;

  if (!email || !isAllowedUserEmail(email, env)) {
    throw new Error("This email is not allowed to access the Almanac alpha.");
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    email ||
    "Almanac user";

  const existingByClerkId = await db.user.findUnique({
    where: { clerkUserId: clerkUser.id },
  });

  if (existingByClerkId) {
    return db.user.update({
      where: { id: existingByClerkId.id },
      data: { email, name },
    });
  }

  const existingByEmail = await db.user.findUnique({
    where: { email },
  });

  if (existingByEmail) {
    return db.user.update({
      where: { id: existingByEmail.id },
      data: {
        clerkUserId: clerkUser.id,
        email,
        name,
      },
    });
  }

  return db.user.create({
    data: {
      clerkUserId: clerkUser.id,
      email,
      name,
    },
  });
}
