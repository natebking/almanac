import { NextResponse } from "next/server";
import { getEnv, hasGoogleOAuthConfig } from "@/lib/env";
import {
  createGoogleAuthUrl,
  createGoogleOAuthState,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "@/lib/google/oauth";

export async function GET() {
  const env = getEnv();

  if (env.GOOGLE_MODE !== "real") {
    return NextResponse.redirect(
      new URL("/settings/google?google=local", env.APP_URL),
    );
  }

  if (!hasGoogleOAuthConfig(env)) {
    return NextResponse.redirect(
      new URL("/settings/google?google=missing-config", env.APP_URL),
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
