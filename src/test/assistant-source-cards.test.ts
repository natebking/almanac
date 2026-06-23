import { describe, expect, it } from "vitest";
import { buildAssistantSourceCards } from "@/lib/assistant/source-cards";
import type { AssistantInput } from "@/lib/assistant/portfolio-assistant";

const fixture: AssistantInput = {
  today: new Date("2026-06-17T12:00:00.000Z"),
  properties: [
    {
      id: "property_loch",
      address: "Loch Lomand",
      currentTenants: "Avery Johnson",
      rentAmount: "$2,450",
      leaseStart: "2026-01-01",
      leaseEnd: "2026-12-31",
      tenantPhone: "555-0144",
      tenantBirthdays: "Avery Johnson: June 20",
      tenantNotes: "Prefers text messages.",
      status: "Active",
      driveFolderUrl: "https://drive.google.com/drive/folders/loch",
    },
  ],
  driveFiles: [
    {
      id: "drive_maintenance",
      name: "Loch Lomand Dishwasher Repair",
      category: "maintenance",
      webViewLink: "https://drive.google.com/loch-maintenance",
      propertyIndexId: "property_loch",
      textExtract:
        "Dishwasher replaced by Jim's HVAC on 2026-05-10. Warranty expires on 2027-05-10.",
    },
  ],
  templates: [
    {
      id: "template_move_in",
      name: "Move-In Checklist",
      description: "Reusable move-in checklist template.",
    },
  ],
  vendors: [
    {
      id: "vendor_jim",
      name: "Jim's HVAC",
      trade: "HVAC",
      phone: "555-0188",
      email: "service@jim.example",
      notes: "Completed the Loch Lomand dishwasher replacement.",
      licenseStatus: "License on file",
      insuranceStatus: "Insurance on file",
      propertyLinks: [
        {
          id: "property_loch",
          address: "Loch Lomand",
        },
      ],
    },
  ],
  generatedDocuments: [
    {
      id: "generated_move_in",
      title: "Move-In Checklist - Loch Lomand",
      status: "generated",
      renderedBody:
        "Move-In Checklist for Avery Johnson at Loch Lomand. Confirm keys are delivered.",
      pdfUrl: "/api/documents/pdf/generated_move_in",
      googleDocUrl: "https://docs.google.com/document/d/generated-move-in",
      errorMessage: null,
      propertyIndexId: "property_loch",
      propertyAddress: "Loch Lomand",
      createdAt: new Date("2026-06-17T15:00:00.000Z"),
    },
  ],
};

describe("buildAssistantSourceCards", () => {
  it("turns property and Drive citations into readable source cards", () => {
    const cards = buildAssistantSourceCards(
      [
        {
          label: "Master spreadsheet row for Loch Lomand",
          href: "/houses/property_loch",
        },
        {
          label: "Loch Lomand Dishwasher Repair",
          href: "https://drive.google.com/loch-maintenance",
        },
      ],
      fixture,
    );

    expect(cards).toEqual([
      {
        label: "Master spreadsheet row for Loch Lomand",
        href: "/houses/property_loch",
        actionLabel: "Open house",
        sourceType: "Master spreadsheet",
        detail:
          "Tenant(s): Avery Johnson - Rent: $2,450 - Lease start: 2026-01-01 - Lease end: 2026-12-31 - Birthdays: Avery Johnson: June 20 - Notes: Prefers text messages. - Status: Active",
      },
      {
        label: "Loch Lomand Dishwasher Repair",
        href: "https://drive.google.com/loch-maintenance",
        actionLabel: "Open file",
        target: "_blank",
        sourceType: "Google Drive",
        detail:
          "maintenance - Dishwasher replaced by Jim's HVAC on 2026-05-10. Warranty expires on 2027-05-10.",
      },
    ]);
  });

  it("explains document-generation workflow links", () => {
    const cards = buildAssistantSourceCards(
      [
        {
          label: "Review and generate Move-In Checklist for Loch Lomand",
          href: "/documents?template=template_move_in&property=property_loch",
        },
      ],
      fixture,
    );

    expect(cards).toEqual([
      {
        label: "Review and generate Move-In Checklist for Loch Lomand",
        href: "/documents?template=template_move_in&property=property_loch",
        actionLabel: "Generate",
        sourceType: "Document workflow",
        detail: "Prefills Move-In Checklist for Loch Lomand before creating a copy.",
      },
    ]);
  });

  it("turns property Drive folder citations into readable source cards", () => {
    const cards = buildAssistantSourceCards(
      [
        {
          label: "Google Drive folder for Loch Lomand",
          href: "https://drive.google.com/drive/folders/loch",
        },
      ],
      fixture,
    );

    expect(cards).toEqual([
      {
        label: "Google Drive folder for Loch Lomand",
        href: "https://drive.google.com/drive/folders/loch",
        actionLabel: "Open folder",
        target: "_blank",
        sourceType: "Property Drive folder",
        detail: "Opens the Google Drive folder linked to Loch Lomand.",
      },
    ]);
  });

  it("turns vendor citations into readable source cards", () => {
    const cards = buildAssistantSourceCards(
      [
        {
          label: "Jim's HVAC",
          href: "/vendors#vendor_jim",
        },
      ],
      fixture,
    );

    expect(cards).toEqual([
      {
        label: "Jim's HVAC",
        href: "/vendors#vendor_jim",
        actionLabel: "Open vendor",
        sourceType: "Vendor directory",
        detail:
          "HVAC - Phone: 555-0188 - Email: service@jim.example - License: License on file - Insurance: Insurance on file - Properties: Loch Lomand",
      },
    ]);
  });

  it("turns generated document citations into readable source cards", () => {
    const cards = buildAssistantSourceCards(
      [
        {
          label: "Move-In Checklist - Loch Lomand",
          href: "/documents?generated=generated_move_in",
        },
      ],
      fixture,
    );

    expect(cards).toEqual([
      {
        label: "Move-In Checklist - Loch Lomand",
        href: "/documents?generated=generated_move_in",
        actionLabel: "Review",
        sourceType: "Generated document",
        detail: "generated - Loch Lomand - PDF ready - Google Doc linked",
        generatedActions: {
          reviewHref: "/documents?generated=generated_move_in",
          printHref: "/api/documents/pdf/generated_move_in",
          googleDocHref: "https://docs.google.com/document/d/generated-move-in",
        },
      },
    ]);
  });

  it("keeps unknown citations visible without inventing details", () => {
    const cards = buildAssistantSourceCards(
      [{ label: "Unknown source", href: "https://example.com/unknown" }],
      fixture,
    );

    expect(cards).toEqual([
      {
        label: "Unknown source",
        href: "https://example.com/unknown",
        actionLabel: "Open source",
        target: "_blank",
        sourceType: "Source",
        detail: "Open the linked source to review it.",
      },
    ]);
  });
});
