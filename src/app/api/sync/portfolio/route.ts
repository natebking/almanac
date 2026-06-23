import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { getAuthorizedOAuthClient } from "@/lib/google/oauth";
import { RealGoogleWorkspaceAdapter } from "@/lib/google/real-adapter";
import { getAlphaUser } from "@/lib/session";
import {
  PortfolioSyncError,
  syncPortfolioIndex,
  validatePortfolioSyncSetup,
} from "@/lib/sync/portfolio-sync";
import { applyPortfolioSyncSuccessParams } from "@/lib/sync/portfolio-sync-redirect";
import { resolvePortfolioSourceConfig } from "@/lib/sync/source-config";

export async function POST(request: Request) {
  const user = await getAlphaUser();
  const env = getEnv();
  const db = await getDb();
  const account = await db.googleAccount.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  const sources = await db.sourceConnection.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  const sourceConfig = resolvePortfolioSourceConfig({ env, sources });
  const redirectUrl = new URL("/settings/google", request.url);

  try {
    validatePortfolioSyncSetup({
      googleMode: env.GOOGLE_MODE,
      spreadsheetId: sourceConfig.spreadsheetId,
      sheetName: sourceConfig.sheetName,
      driveRootFolderId: sourceConfig.driveRootFolderId,
      hasConnectedAccount: Boolean(account),
    });

    const { client } = await getAuthorizedOAuthClient(user.id);
    const result = await syncPortfolioIndex({
      userId: user.id,
      adapter: new RealGoogleWorkspaceAdapter(client),
      googleMode: env.GOOGLE_MODE,
      spreadsheetId: sourceConfig.spreadsheetId,
      sheetName: sourceConfig.sheetName,
      driveRootFolderId: sourceConfig.driveRootFolderId,
      hasConnectedAccount: true,
    });

    applyPortfolioSyncSuccessParams(redirectUrl, result);
  } catch (error) {
    redirectUrl.searchParams.set("sync", "error");
    redirectUrl.searchParams.set("code", errorCode(error));
    redirectUrl.searchParams.set("message", errorMessage(error));
  }

  return NextResponse.redirect(redirectUrl, { status: 303 });
}

function errorCode(error: unknown): string {
  return error instanceof PortfolioSyncError ? error.code : "google-sync";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Portfolio sync failed.";
}
