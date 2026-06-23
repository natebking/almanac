import { describe, expect, it } from "vitest";
import { buildDashboardAttentionItems } from "@/lib/dashboard/attention";

const today = new Date("2026-06-17T12:00:00.000Z");

describe("buildDashboardAttentionItems", () => {
  it("builds sorted command-center items from leases, vacancies, projects, and documents", () => {
    const items = buildDashboardAttentionItems({
      today,
      properties: [
        {
          id: "property_verona",
          address: "Verona",
          leaseStart: "2025-08-01",
          leaseEnd: "2026-08-01",
          status: "Active",
          tenantNotes: "Renewal decision needed.",
        },
        {
          id: "property_wood",
          address: "Wood Court",
          leaseStart: "",
          leaseEnd: "",
          status: "Vacant",
          tenantNotes: "Vacant and ready for showing.",
        },
      ],
      projects: [
        {
          id: "project_wood",
          name: "Wood Court Remodel Scope",
          webViewLink: "https://docs.google.com/document/d/project_wood",
          propertyIndex: { address: "Wood Court" },
        },
      ],
      generatedDocuments: [
        {
          id: "doc_loch",
          title: "Move-In Checklist - Loch Lomand",
          status: "generated",
          property: null,
          propertyIndex: { address: "Loch Lomand" },
        },
      ],
    });

    expect(items).toEqual([
      {
        id: "lease-property_verona",
        title: "Verona lease expires",
        subtitle: "2026-08-01 - 45 days",
        href: "/houses/property_verona",
        label: "lease",
        tone: "warning",
        priority: 10,
      },
      {
        id: "vacant-property_wood",
        title: "Wood Court is vacant",
        subtitle: "Vacant and ready for showing.",
        href: "/houses/property_wood",
        label: "vacant",
        tone: "info",
        priority: 20,
      },
      {
        id: "project-project_wood",
        title: "Wood Court Remodel Scope",
        subtitle: "Wood Court",
        href: "https://docs.google.com/document/d/project_wood",
        label: "project",
        tone: "warning",
        priority: 30,
      },
      {
        id: "document-doc_loch",
        title: "Move-In Checklist - Loch Lomand",
        subtitle: "Loch Lomand - ready to review / print",
        href: "/documents?generated=doc_loch",
        label: "document",
        tone: "success",
        priority: 40,
      },
    ]);
  });

  it("omits leases that are outside the 90 day dashboard window", () => {
    const items = buildDashboardAttentionItems({
      today,
      properties: [
        {
          id: "property_loch",
          address: "Loch Lomand",
          leaseStart: "2026-01-01",
          leaseEnd: "2026-12-31",
          status: "Active",
          tenantNotes: "",
        },
      ],
      projects: [],
      generatedDocuments: [],
    });

    expect(items).toEqual([]);
  });

  it("surfaces upcoming move-ins within 30 days", () => {
    const items = buildDashboardAttentionItems({
      today,
      properties: [
        {
          id: "property_maiden",
          address: "161 Maiden Lane",
          leaseStart: "2026-06-25",
          leaseEnd: "2027-06-24",
          status: "Active",
          tenantNotes: "Move-in packet still needs printing.",
        },
      ],
      projects: [],
      generatedDocuments: [],
    });

    expect(items).toEqual([
      {
        id: "move-in-property_maiden",
        title: "161 Maiden Lane move-in coming up",
        subtitle: "2026-06-25 - 8 days",
        href: "/houses/property_maiden",
        label: "move-in",
        tone: "success",
        priority: 15,
      },
    ]);
  });

  it("omits past move-ins and move-ins beyond the 30 day dashboard window", () => {
    const items = buildDashboardAttentionItems({
      today,
      properties: [
        {
          id: "property_old",
          address: "Old Lease",
          leaseStart: "2026-06-01",
          leaseEnd: "2027-05-31",
          status: "Active",
          tenantNotes: "",
        },
        {
          id: "property_later",
          address: "Later Lease",
          leaseStart: "2026-08-01",
          leaseEnd: "2027-07-31",
          status: "Active",
          tenantNotes: "",
        },
      ],
      projects: [],
      generatedDocuments: [],
    });

    expect(items).toEqual([]);
  });
});
