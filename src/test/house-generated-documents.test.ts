import { describe, expect, it } from "vitest";
import { buildHouseGeneratedDocumentCards } from "@/lib/houses/generated-documents";

describe("buildHouseGeneratedDocumentCards", () => {
  it("builds review, print, and Google Doc links for a house page", () => {
    const cards = buildHouseGeneratedDocumentCards([
      {
        id: "generated_move_in",
        title: "Move-In Checklist - Loch Lomand",
        status: "generated",
        pdfUrl: "/api/documents/pdf/generated_move_in",
        googleDocUrl: "https://docs.google.com/document/d/generated-move-in",
        property: null,
        propertyIndex: { address: "Loch Lomand" },
      },
      {
        id: "generated_error",
        title: "Welcome Letter - Loch Lomand",
        status: "error",
        pdfUrl: null,
        googleDocUrl: null,
        property: null,
        propertyIndex: { address: "Loch Lomand" },
      },
    ]);

    expect(cards).toEqual([
      {
        id: "generated_move_in",
        title: "Move-In Checklist - Loch Lomand",
        propertyAddress: "Loch Lomand",
        status: "generated",
        reviewHref: "/documents?generated=generated_move_in",
        printHref: "/api/documents/pdf/generated_move_in",
        googleDocHref: "https://docs.google.com/document/d/generated-move-in",
        tone: "success",
      },
      {
        id: "generated_error",
        title: "Welcome Letter - Loch Lomand",
        propertyAddress: "Loch Lomand",
        status: "error",
        reviewHref: "/documents?generated=generated_error",
        printHref: null,
        googleDocHref: null,
        tone: "danger",
      },
    ]);
  });
});
