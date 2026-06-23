import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { getAuthorizedOAuthClient } from "@/lib/google/oauth";
import { RealGoogleWorkspaceAdapter } from "@/lib/google/real-adapter";
import { getAlphaUser } from "@/lib/session";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pdfFilename(title: string) {
  return (
    title
      .replaceAll(/[\\/:*?"<>|\r\n]+/g, " ")
      .replaceAll(/\s+/g, " ")
      .trim() || "generated-document"
  );
}

async function exportGooglePdf(input: {
  userId: string;
  googleDocId: string | null;
}): Promise<Uint8Array | null> {
  if (getEnv().GOOGLE_MODE !== "real" || !input.googleDocId) {
    return null;
  }

  try {
    const { client } = await getAuthorizedOAuthClient(input.userId);
    const adapter = new RealGoogleWorkspaceAdapter(client);

    return adapter.exportDriveFilePdf({ fileId: input.googleDocId });
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const db = await getDb();
  const user = await getAlphaUser();
  const document = await db.generatedDocument.findFirst({
    where: { id, userId: user.id },
    include: { property: true, propertyIndex: true, template: true },
  });

  if (!document) {
    return new NextResponse("Document not found.", { status: 404 });
  }

  const propertyAddress =
    document.propertyIndex?.address ?? document.property?.address ?? "Property";
  const googlePdf = await exportGooglePdf({
    userId: user.id,
    googleDocId: document.googleDocId,
  });

  if (googlePdf) {
    const body = new ArrayBuffer(googlePdf.byteLength);
    new Uint8Array(body).set(googlePdf);

    return new NextResponse(body, {
      headers: {
        "content-disposition": `inline; filename="${pdfFilename(document.title)}.pdf"`,
        "content-type": "application/pdf",
      },
    });
  }

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(document.title)}</title>
    <style>
      :root { color: #141815; background: #f7f4ee; font-family: "Hanken Grotesk", Arial, Helvetica, sans-serif; }
      body { margin: 0; padding: 24px; }
      main { max-width: 760px; margin: 0 auto; background: #fffdf9; border: 1px solid #e3dccf; border-radius: 16px; box-shadow: 0 4px 16px rgba(33,48,39,.08); padding: 28px; }
      h1 { font-size: 28px; line-height: 1.1; margin: 0 0 6px; }
      p { color: #7c7466; margin: 0 0 20px; }
      pre { white-space: pre-wrap; font: 16px/1.55 "Hanken Grotesk", Arial, Helvetica, sans-serif; margin: 0; }
      button { margin-bottom: 20px; min-height: 44px; border: 0; border-radius: 12px; padding: 0 16px; background: #2c5043; color: #fffdf9; font: 760 14px "Hanken Grotesk", Arial, Helvetica, sans-serif; cursor: pointer; }
      button:hover { background: #244438; }
      @media print {
        :root, body { background: white; }
        body { padding: 0; }
        main { border: 0; box-shadow: none; padding: 0; max-width: none; }
        button { display: none; }
      }
    </style>
  </head>
  <body>
    <main>
      <button onclick="window.print()">Print</button>
      <h1>${escapeHtml(document.title)}</h1>
      <p>${escapeHtml(propertyAddress)} · ${escapeHtml(document.template.name)}</p>
      <pre>${escapeHtml(document.renderedBody)}</pre>
    </main>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}
