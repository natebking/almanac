import { NextResponse } from "next/server";
import { encryptSecret } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import {
  exchangeGoogleCode,
  GOOGLE_OAUTH_STATE_COOKIE,
  isValidGoogleOAuthState,
} from "@/lib/google/oauth";
import { getAlphaUser } from "@/lib/session";

export async function GET(request: Request) {
  const env = getEnv();
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = readCookie(
    request.headers.get("cookie"),
    GOOGLE_OAUTH_STATE_COOKIE,
  );

  if (!isValidGoogleOAuthState(state, expectedState)) {
    return redirectAndClearState("/settings/google?google=invalid-state", env.APP_URL);
  }

  if (error || !code) {
    return redirectAndClearState(
      `/settings/google?google=${error ?? "missing-code"}`,
      env.APP_URL,
    );
  }

  try {
    const user = await getAlphaUser();
    const db = await getDb();
    const existing = await db.googleAccount.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    const { tokens, googleEmail } = await exchangeGoogleCode(code);
    const data = {
      userId: user.id,
      googleEmail,
      encryptedAccessToken: encryptSecret(tokens.access_token),
      encryptedRefreshToken:
        encryptSecret(tokens.refresh_token) ??
        existing?.encryptedRefreshToken ??
        null,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scopes: tokens.scope ?? "",
    };

    if (existing) {
      await db.googleAccount.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await db.googleAccount.create({ data });
    }

    return redirectAndClearState("/settings/google?google=connected", env.APP_URL);
  } catch (error) {
    console.error("Google OAuth callback failed", error);

    return redirectAndClearState(
      "/settings/google?google=exchange-failed",
      env.APP_URL,
    );
  }
}

function readCookie(cookieHeader: string | null, name: string) {
  return (
    cookieHeader
      ?.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null
  );
}

function redirectAndClearState(path: string, appUrl: string) {
  const response = NextResponse.redirect(new URL(path, appUrl));
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  return response;
}
