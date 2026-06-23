import { randomBytes, timingSafeEqual } from "node:crypto";
import { google } from "googleapis";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { getEnv, hasOptionalGoogleDiagnostics } from "@/lib/env";
import { buildGoogleScopes } from "@/lib/google/scopes";

export type GoogleOAuthClient = InstanceType<typeof google.auth.OAuth2>;
export const GOOGLE_OAUTH_STATE_COOKIE = "almanac_google_oauth_state";

export function createGoogleOAuthState() {
  return randomBytes(32).toString("base64url");
}

export function isValidGoogleOAuthState(
  actual: string | null | undefined,
  expected: string | null | undefined,
) {
  if (!actual || !expected) {
    return false;
  }

  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function createOAuthClient(): GoogleOAuthClient {
  const env = getEnv();
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}

export function createGoogleAuthUrl(state: string) {
  const env = getEnv();

  return createOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: buildGoogleScopes({
      includeOptionalDiagnostics: hasOptionalGoogleDiagnostics(env),
    }),
    state,
  });
}

export async function exchangeGoogleCode(code: string) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: client, version: "v2" });
  const profile = await oauth2.userinfo.get();

  return {
    tokens,
    googleEmail: profile.data.email ?? null,
  };
}

export async function getAuthorizedOAuthClient(userId: string) {
  const db = await getDb();
  const account = await db.googleAccount.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!account) {
    throw new Error("Google account is not connected.");
  }

  const client = createOAuthClient();
  client.setCredentials({
    access_token: decryptSecret(account.encryptedAccessToken) ?? undefined,
    refresh_token: decryptSecret(account.encryptedRefreshToken) ?? undefined,
    expiry_date: account.tokenExpiry?.getTime(),
    scope: account.scopes,
  });

  client.on("tokens", async (tokens) => {
    await db.googleAccount.update({
      where: { id: account.id },
      data: {
        encryptedAccessToken:
          encryptSecret(tokens.access_token) ?? account.encryptedAccessToken,
        encryptedRefreshToken:
          encryptSecret(tokens.refresh_token) ?? account.encryptedRefreshToken,
        tokenExpiry: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : account.tokenExpiry,
        scopes: tokens.scope ?? account.scopes,
      },
    });
  });

  return { client, account };
}
