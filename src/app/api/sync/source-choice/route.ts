import { NextResponse } from "next/server";
import { getAlphaUser } from "@/lib/session";
import {
  saveSinglePortfolioSourceConfig,
  SourceConfigError,
} from "@/lib/sync/source-config";

export async function POST(request: Request) {
  const user = await getAlphaUser();
  const formData = await request.formData();
  const redirectUrl = new URL("/settings/google", request.url);

  try {
    await saveSinglePortfolioSourceConfig({
      userId: user.id,
      kind: String(formData.get("kind") ?? "") as
        | "master-spreadsheet"
        | "drive-root",
      googleFileId: String(formData.get("googleFileId") ?? ""),
      name: String(formData.get("name") ?? ""),
      sheetName: String(formData.get("sheetName") ?? ""),
    });

    redirectUrl.searchParams.set("sources", "choice-ok");
  } catch (error) {
    redirectUrl.searchParams.set("sources", "error");
    redirectUrl.searchParams.set("code", sourceConfigErrorCode(error));
    redirectUrl.searchParams.set("message", sourceConfigErrorMessage(error));
  }

  return NextResponse.redirect(redirectUrl, { status: 303 });
}

function sourceConfigErrorCode(error: unknown): string {
  return error instanceof SourceConfigError ? error.code : "source-choice";
}

function sourceConfigErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Could not save selected Google source.";
}
