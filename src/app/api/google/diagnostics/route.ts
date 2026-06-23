import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  getEnv,
  hasGoogleOAuthConfig,
  hasOptionalGoogleDiagnostics,
} from "@/lib/env";
import { buildGoogleWorkspaceDiagnostics } from "@/lib/google/diagnostics";
import { LocalGoogleWorkspaceAdapter } from "@/lib/google/local-adapter";
import { getAuthorizedOAuthClient } from "@/lib/google/oauth";
import { RealGoogleWorkspaceAdapter } from "@/lib/google/real-adapter";
import { buildGoogleScopes } from "@/lib/google/scopes";
import { getAlphaUser } from "@/lib/session";

export async function GET() {
  const env = getEnv();
  const db = await getDb();
  const user = await getAlphaUser();
  const account = await db.googleAccount.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    mode: env.GOOGLE_MODE,
    oauthConfigured: hasGoogleOAuthConfig(env),
    connected: Boolean(account),
    googleEmail: account?.googleEmail ?? null,
    scopes: account?.scopes?.split(" ").filter(Boolean) ?? [],
    tokenExpiry: account?.tokenExpiry?.toISOString() ?? null,
    hasRefreshToken: Boolean(account?.encryptedRefreshToken),
    workspaceDiagnostics: await getWorkspaceDiagnostics({
      userId: user.id,
      realMode: env.GOOGLE_MODE === "real",
      connected: Boolean(account),
    }),
  });
}

async function getWorkspaceDiagnostics(input: {
  userId: string;
  realMode: boolean;
  connected: boolean;
}) {
  if (!input.realMode) {
    const env = getEnv();

    return buildGoogleWorkspaceDiagnostics({
      adapter: new LocalGoogleWorkspaceAdapter(),
      grantedScopes: buildGoogleScopes({
        includeOptionalDiagnostics: hasOptionalGoogleDiagnostics(env),
      }),
    });
  }

  if (!input.connected) {
    return null;
  }

  try {
    const { account, client } = await getAuthorizedOAuthClient(input.userId);

    return buildGoogleWorkspaceDiagnostics({
      adapter: new RealGoogleWorkspaceAdapter(client),
      grantedScopes: account.scopes?.split(" ").filter(Boolean) ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return {
      calendarEvents: [],
      calendarError: `Could not run Calendar diagnostics: ${message}`,
      gmailMessages: [],
      gmailError: `Could not run Gmail diagnostics: ${message}`,
    };
  }
}
