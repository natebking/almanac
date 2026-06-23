import { describe, expect, it } from "vitest";
import { renderLocalDocument } from "@/lib/sample-documents";

describe("renderLocalDocument", () => {
  it("renders a generated document title and body from a template", () => {
    const doc = renderLocalDocument({
      templateName: "Move-In Checklist",
      propertyAddress: "123 Main St",
      body: "Tenant: {{tenant_name}}\nAddress: {{property_address}}",
      values: {
        tenant_name: "Jordan Lee",
        property_address: "123 Main St",
      },
    });

    expect(doc.title).toBe("Move-In Checklist - 123 Main St");
    expect(doc.body).toContain("Tenant: Jordan Lee");
    expect(doc.body).toContain("Address: 123 Main St");
  });
});
