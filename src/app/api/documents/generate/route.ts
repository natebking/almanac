import { NextResponse } from "next/server";
import { generateDocumentForUser } from "@/lib/documents/generate";
import { getAlphaUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getAlphaUser();
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.templateId !== "string" ||
    (typeof body.propertyIndexId !== "string" &&
      typeof body.propertyId !== "string")
  ) {
    return NextResponse.json(
      { error: "templateId and propertyIndexId are required." },
      { status: 400 },
    );
  }

  try {
    const document = await generateDocumentForUser({
      userId: user.id,
      templateId: body.templateId,
      propertyIndexId:
        typeof body.propertyIndexId === "string"
          ? body.propertyIndexId
          : undefined,
      propertyId: typeof body.propertyId === "string" ? body.propertyId : undefined,
      values:
        body.values && typeof body.values === "object"
          ? Object.fromEntries(
              Object.entries(body.values).map(([key, value]) => [
                key,
                String(value ?? ""),
              ]),
            )
          : {},
    });

    return NextResponse.json({
      id: document.id,
      title: document.title,
      status: document.status,
      googleDocUrl: document.googleDocUrl,
      pdfUrl: document.pdfUrl,
    });
  } catch (error) {
    console.error("Document generation failed", error);

    return NextResponse.json(
      {
        error:
          "Document generation failed. Confirm the template and Google connection, then try again.",
      },
      { status: 502 },
    );
  }
}
