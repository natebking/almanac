import { describe, expect, it } from "vitest";
import { buildGeneratedDocumentQueue } from "@/lib/documents/generated-queue";

const documents = [
  {
    id: "doc_ready_google",
    title: "Move-In Checklist - Loch Lomand",
    status: "generated",
    pdfUrl: "/api/documents/pdf/doc_ready_google",
    googleDocUrl: "https://docs.google.com/document/d/doc_ready_google",
    property: null,
    propertyIndex: { address: "Loch Lomand" },
    createdAt: new Date("2026-06-17T12:00:00.000Z"),
  },
  {
    id: "doc_ready_local",
    title: "Welcome Letter - Verona",
    status: "generated",
    pdfUrl: "/api/documents/pdf/doc_ready_local",
    googleDocUrl: null,
    property: null,
    propertyIndex: { address: "Verona" },
    createdAt: new Date("2026-06-16T12:00:00.000Z"),
  },
  {
    id: "doc_failed",
    title: "Owner Update - Wood Court",
    status: "error",
    pdfUrl: null,
    googleDocUrl: null,
    property: null,
    propertyIndex: { address: "Wood Court" },
    createdAt: new Date("2026-06-15T12:00:00.000Z"),
  },
];

describe("buildGeneratedDocumentQueue", () => {
  it("builds review and print actions for generated documents", () => {
    expect(buildGeneratedDocumentQueue(documents)).toEqual([
      {
        id: "doc_ready_google",
        title: "Move-In Checklist - Loch Lomand",
        propertyAddress: "Loch Lomand",
        status: "generated",
        reviewHref: "/documents?generated=doc_ready_google",
        printHref: "/api/documents/pdf/doc_ready_google",
        googleDocHref: "https://docs.google.com/document/d/doc_ready_google",
      },
      {
        id: "doc_ready_local",
        title: "Welcome Letter - Verona",
        propertyAddress: "Verona",
        status: "generated",
        reviewHref: "/documents?generated=doc_ready_local",
        printHref: "/api/documents/pdf/doc_ready_local",
        googleDocHref: null,
      },
    ]);
  });
});
