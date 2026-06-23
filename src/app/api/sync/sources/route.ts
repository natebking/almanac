import { NextResponse } from "next/server";
import { getAlphaUser } from "@/lib/session";
import {
  savePortfolioSourceConfig,
  SourceConfigError,
} from "@/lib/sync/source-config";

export async function POST(request: Request) {
  const user = await getAlphaUser();
  const formData = await request.formData();
  const redirectUrl = new URL("/settings/google", request.url);

  try {
    await savePortfolioSourceConfig({
      userId: user.id,
      spreadsheetInput: String(formData.get("spreadsheetInput") ?? ""),
      sheetName: String(formData.get("sheetName") ?? ""),
      driveRootInput: String(formData.get("driveRootInput") ?? ""),
    });

    redirectUrl.searchParams.set("sources", "ok");
  } catch (error) {
    redirectUrl.searchParams.set("sources", "error");
    redirectUrl.searchParams.set("code", sourceConfigErrorCode(error));
    redirectUrl.searchParams.set("message", sourceConfigErrorMessage(error));
  }

  return NextResponse.redirect(redirectUrl, { status: 303 });
}

function sourceConfigErrorCode(error: unknown): string {
  return error instanceof SourceConfigError ? error.code : "source-config";
}

function sourceConfigErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Could not save Google source setup.";
}
