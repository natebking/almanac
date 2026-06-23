import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { DEMO_USER_COOKIE } from "@/lib/demo-cookie";
import {
  hostedSetupIssue,
  shouldRedirectHostedPathToSignIn,
  type HostedSetupIssue,
} from "@/lib/hosted-setup";

const isPublicRoute = createRouteMatcher([
  "/open-source(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/setup-required(.*)",
]);

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  if (process.env.AUTH_MODE !== "clerk") {
    return withDemoUserCookie(req);
  }

  const setupIssue = hostedSetupIssue(process.env);
  if (setupIssue) {
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }

    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: setupIssueMessage(setupIssue) },
        { status: 503 },
      );
    }

    const setupUrl = req.nextUrl.clone();
    setupUrl.pathname = "/setup-required";
    setupUrl.searchParams.set("reason", setupIssue);
    return NextResponse.redirect(setupUrl);
  }

  const clerkProxy = clerkMiddleware(async (auth, clerkReq) => {
    if (!isPublicRoute(clerkReq)) {
      const authState = await auth();
      if (
        !authState.userId &&
        shouldRedirectHostedPathToSignIn(clerkReq.nextUrl.pathname)
      ) {
        return authState.redirectToSignIn({
          returnBackUrl: clerkReq.url,
        });
      }

      await auth.protect();
    }
  });

  return clerkProxy(req, event);
}

// In demo mode (AUTH_MODE !== "clerk") every visitor gets a private sandbox
// keyed by a per-browser cookie. Mint it on first request, and forward it on
// the request headers so the very first render already resolves to the new
// sandbox instead of a throwaway shared user.
function withDemoUserCookie(req: NextRequest) {
  if (req.cookies.get(DEMO_USER_COOKIE)?.value) {
    return NextResponse.next();
  }

  const id = crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  const existingCookie = requestHeaders.get("cookie");
  requestHeaders.set(
    "cookie",
    existingCookie
      ? `${existingCookie}; ${DEMO_USER_COOKIE}=${id}`
      : `${DEMO_USER_COOKIE}=${id}`,
  );

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const secure = forwardedProto
    ? forwardedProto === "https"
    : req.nextUrl.protocol === "https:";
  response.cookies.set(DEMO_USER_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return response;
}

function setupIssueMessage(issue: HostedSetupIssue) {
  if (issue === "missing-clerk") {
    return "Almanac setup required: Clerk environment variables are missing.";
  }
  if (issue === "missing-allowed-users") {
    return "Almanac setup required: allowed user emails are missing.";
  }
  return "Almanac setup required: Google OAuth credentials are missing.";
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
