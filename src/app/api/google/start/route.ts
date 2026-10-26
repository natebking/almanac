import { NextResponse } from "next/server";
import { getEnv, hasGoogleOAuthConfig } from "@/lib/env";
import {
  createGoogleAuthUrl,
  createGoogleOAuthState,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "@/lib/google/oauth";

export async function GET(request: Request) {
  const env = getEnv();

  // The local and missing-config bounces stay on the host the visitor came
  // from. APP_URL only matters once real OAuth is configured, so a deployment
  // that never set it (the public demo) must not redirect to localhost.

  if (env.GOOGLE_MODE !== "real") {
    return NextResponse.redirect(
      new URL("/settings/google?google=local", request.url),
    );
  }

  if (!hasGoogleOAuthConfig(env)) {
    return NextResponse.redirect(
      new URL("/settings/google?google=missing-config", request.url),
    );
  }

  const state = createGoogleOAuthState();
  const response = NextResponse.redirect(createGoogleAuthUrl(state));
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: env.APP_URL.startsWith("https://"),
  });

  return response;
}
