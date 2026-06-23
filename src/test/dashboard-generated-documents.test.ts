import { describe, expect, it } from "vitest";
import { buildRecentGeneratedDocumentCards } from "@/lib/dashboard/generated-documents";

describe("buildRecentGeneratedDocumentCards", () => {
  it("builds dashboard review actions for recent generated documents", () => {
    expect(
      buildRecentGeneratedDocumentCards([
        {
          id: "generated_ready",
          title: "Move-In Checklist - Loch Lomand",
          status: "generated",
          pdfUrl: "/api/documents/pdf/generated_ready",
          googleDocUrl: "https://docs.google.com/document/d/generated-ready",
          property: null,
          propertyIndex: { address: "Loch Lomand" },
        },
        {
          id: "generated_error",
          title: "Welcome Letter - Wood Court",
          status: "error",
          pdfUrl: null,
          googleDocUrl: null,
          property: { address: "Wood Court" },
          propertyIndex: null,
        },
      ]),
    ).toEqual([
      {
        id: "generated_ready",
        title: "Move-In Checklist - Loch Lomand",
        propertyAddress: "Loch Lomand",
        status: "generated",
        reviewHref: "/documents?generated=generated_ready",
        printHref: "/api/documents/pdf/generated_ready",
        googleDocHref: "https://docs.google.com/document/d/generated-ready",
        tone: "success",
      },
      {
        id: "generated_error",
        title: "Welcome Letter - Wood Court",
        propertyAddress: "Wood Court",
        status: "error",
        reviewHref: "/documents?generated=generated_error",
        printHref: null,
        googleDocHref: null,
        tone: "danger",
      },
    ]);
  });
});
