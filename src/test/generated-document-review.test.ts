import { describe, expect, it } from "vitest";
import { buildGeneratedDocumentReview } from "@/lib/documents/generated-review";

const documents = [
  {
    id: "doc_old",
    title: "Welcome Letter - Verona",
    status: "generated",
    renderedBody: "Welcome Mia.",
    pdfUrl: "/api/documents/pdf/doc_old",
    googleDocUrl: null,
    errorMessage: null,
    property: null,
    propertyIndex: { address: "Verona" },
  },
  {
    id: "doc_selected",
    title: "Move-In Checklist - Loch Lomand",
    status: "generated",
    renderedBody: "Tenant: Avery Johnson\nProperty: Loch Lomand",
    pdfUrl: "/api/documents/pdf/doc_selected",
    googleDocUrl: "https://docs.google.com/document/d/doc_selected",
    errorMessage: null,
    property: null,
    propertyIndex: { address: "Loch Lomand" },
  },
  {
    id: "doc_error",
    title: "Welcome Letter - Verona",
    status: "error",
    renderedBody: "Tenant: Mia Chen\nProperty: Verona",
    pdfUrl: null,
    googleDocUrl: null,
    errorMessage: "Google copy failed",
    property: null,
    propertyIndex: { address: "Verona" },
  },
];

describe("buildGeneratedDocumentReview", () => {
  it("builds a review model for the selected generated document", () => {
    expect(
      buildGeneratedDocumentReview({
        documents,
        selectedGeneratedId: "doc_selected",
      }),
    ).toEqual({
      id: "doc_selected",
      title: "Move-In Checklist - Loch Lomand",
      propertyAddress: "Loch Lomand",
      status: "generated",
      renderedBody: "Tenant: Avery Johnson\nProperty: Loch Lomand",
      pdfUrl: "/api/documents/pdf/doc_selected",
      googleDocUrl: "https://docs.google.com/document/d/doc_selected",
      hasGoogleDoc: true,
      errorMessage: null,
    });
  });

  it("keeps the failure reason for an errored generated document", () => {
    expect(
      buildGeneratedDocumentReview({
        documents,
        selectedGeneratedId: "doc_error",
      }),
    ).toEqual({
      id: "doc_error",
      title: "Welcome Letter - Verona",
      propertyAddress: "Verona",
      status: "error",
      renderedBody: "Tenant: Mia Chen\nProperty: Verona",
      pdfUrl: null,
      googleDocUrl: null,
      hasGoogleDoc: false,
      errorMessage: "Google copy failed",
    });
  });

  it("returns null when no generated document is selected", () => {
    expect(
      buildGeneratedDocumentReview({
        documents,
        selectedGeneratedId: "",
      }),
    ).toBeNull();
  });

  it("returns null when the selected generated document is not loaded", () => {
    expect(
      buildGeneratedDocumentReview({
        documents,
        selectedGeneratedId: "missing_doc",
      }),
    ).toBeNull();
  });
});
