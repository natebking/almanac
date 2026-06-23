import { createSeedClient } from "../../../../../prisma/seed";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Per-visitor demo sandboxes (cookie-keyed users, which have no email) are
// recycled after this many days so the demo database does not grow unbounded.
// A returning visitor within the window keeps their sandbox.
const SANDBOX_TTL_DAYS = 7;

// Daily garbage collection for the public sample demo (demo.almanac.homes). A
// Vercel Cron (see vercel.json) hits this once a day to delete stale
// per-visitor sandboxes; cascade deletes remove each sandbox's properties,
// vendors, documents, etc. The shared fallback user (which has an email) and
// any real authenticated users are never touched.
//
// Hard guard: this ONLY runs on the sample-demo deployment (mock Google + no
// auth). A real self-hosted deployment (real Google or Clerk auth) is refused,
// so this can never delete a real operator's connected data.
export async function GET(request: Request) {
  if (process.env.GOOGLE_MODE !== "local" || process.env.AUTH_MODE !== "alpha") {
    return Response.json({ skipped: "not a sample-demo deployment" });
  }

  // Vercel Cron attaches `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET
  // is configured, so external callers cannot trigger the GC.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cutoff = new Date(Date.now() - SANDBOX_TTL_DAYS * 24 * 60 * 60 * 1000);
  const prisma = await createSeedClient();
  try {
    const { count } = await prisma.user.deleteMany({
      where: { email: null, createdAt: { lt: cutoff } },
    });
    return Response.json({ ok: true, recycled: count });
  } catch (error) {
    console.error("Demo sandbox GC failed", error);
    return Response.json({ ok: false }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
