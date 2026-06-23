import { describe, expect, it } from "vitest";
import { generatedDocumentRedirectHref } from "@/lib/documents/generated-redirect";

describe("generatedDocumentRedirectHref", () => {
  it("returns the in-app review URL by default", () => {
    expect(
      generatedDocumentRedirectHref({
        id: "generated_1",
        mode: "review",
        pdfUrl: "/api/documents/pdf/generated_1",
        status: "generated",
      }),
    ).toBe("/documents?generated=generated_1");
  });

  it("returns the print review URL for successful fast generation", () => {
    expect(
      generatedDocumentRedirectHref({
        id: "generated_1",
        mode: "print",
        pdfUrl: "/api/documents/pdf/generated_1",
        status: "generated",
      }),
    ).toBe("/api/documents/pdf/generated_1");
  });

  it("keeps failed fast generation on the in-app review URL", () => {
    expect(
      generatedDocumentRedirectHref({
        id: "generated_error",
        mode: "print",
        pdfUrl: null,
        status: "error",
      }),
    ).toBe("/documents?generated=generated_error");
  });
});
