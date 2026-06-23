import { describe, expect, it, vi } from "vitest";
import {
  answerGroundedPortfolioQuestion,
  buildAssistantGrounding,
} from "@/lib/assistant/grounded-assistant";
import type { AssistantInput } from "@/lib/assistant/portfolio-assistant";

const fixture: AssistantInput = {
  today: new Date("2026-06-17T12:00:00.000Z"),
  properties: [
    {
      id: "property_estates",
      address: "Estates",
      currentTenants: "Olivia Martin",
      rentAmount: "$3,150",
      leaseEnd: "2027-01-31",
      tenantPhone: "555-0181",
      tenantEmail: "olivia@example.com",
      tenantNotes: "Owner wants a heads-up before non-urgent vendor visits.",
      pets: "2 dogs",
      owner: "Example Property Group",
      brokerSplit: "75 / 25",
      status: "Active",
      driveFolderUrl: "https://drive.google.com/drive/folders/estates",
      profile: {
        applianceInfo: "Two HVAC zones. Kitchen fridge replaced in 2025.",
        filterSize: "20x25x4",
        homeWarranty: "Warranty covers HVAC through 2026-11-30.",
        hoaInfo: "HOA requires 48-hour notice for exterior vendors.",
        utilityProviders: "Electric: City Power. Water: Estates Utility District.",
        accessCodes: "Side gate: 7788.",
      },
    },
    {
      id: "property_wood",
      address: "Wood Court",
      currentTenants: "",
      rentAmount: "$0",
      leaseEnd: "",
      tenantPhone: "",
      tenantEmail: "",
      pets: "",
      owner: "Example Property Group",
      brokerSplit: "70 / 30",
      status: "Vacant",
      driveFolderUrl: "",
      profile: null,
    },
  ],
  driveFiles: [
    {
      id: "drive_estates_invoice",
      name: "Estates HVAC Maintenance Invoice",
      category: "maintenance",
      webViewLink: "https://drive.google.com/file/d/maintenance-estates",
      propertyIndexId: "property_estates",
      textExtract: "HVAC maintenance completed at Estates by Clear Air HVAC.",
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
      id: "vendor_clear_air",
      name: "Clear Air HVAC",
      trade: "HVAC",
      phone: "555-0188",
      email: "service@clearair.example",
      notes: "Use for seasonal maintenance.",
      licenseStatus: "Needs renewal check",
      insuranceStatus: "Insurance on file",
      propertyLinks: [
        {
          id: "property_estates",
          address: "Estates",
        },
      ],
    },
  ],
  generatedDocuments: [
    {
      id: "generated_estates_update",
      title: "Owner Update - Estates",
      status: "generated",
      renderedBody:
        "Owner update for Estates: HVAC maintenance was completed by Clear Air HVAC.",
      pdfUrl: "/api/documents/pdf/generated_estates_update",
      googleDocUrl: "https://docs.google.com/document/d/generated-estates-update",
      errorMessage: null,
      propertyIndexId: "property_estates",
      propertyAddress: "Estates",
      createdAt: new Date("2026-06-17T16:00:00.000Z"),
    },
  ],
};

describe("grounded assistant", () => {
  it("builds a compact grounding bundle from indexed portfolio data", () => {
    const grounding = buildAssistantGrounding(
      "What maintenance has been completed at Estates?",
      fixture,
    );

    expect(grounding.question).toBe("What maintenance has been completed at Estates?");
    expect(grounding.facts).toEqual([
      expect.objectContaining({
        label: "Master spreadsheet row for Estates",
        href: "/houses/property_estates",
        text: expect.stringContaining("Tenant email: olivia@example.com"),
      }),
      expect.objectContaining({
        label: "Property profile for Estates",
        href: "/houses/property_estates",
        text: expect.stringContaining("Filter size: 20x25x4"),
      }),
      expect.objectContaining({
        label: "Google Drive folder for Estates",
        href: "https://drive.google.com/drive/folders/estates",
        text: "Google Drive folder for Estates.",
      }),
      expect.objectContaining({
        label: "Estates HVAC Maintenance Invoice",
        href: "https://drive.google.com/file/d/maintenance-estates",
        text: expect.stringContaining("HVAC maintenance completed at Estates"),
      }),
    ]);
    expect(grounding.facts[0]).toEqual(
      expect.objectContaining({
        label: "Master spreadsheet row for Estates",
        href: "/houses/property_estates",
        text: expect.stringContaining(
          "Tenant notes: Owner wants a heads-up before non-urgent vendor visits.",
        ),
      }),
    );
  });

  it("adds matching vendor directory facts to the grounding bundle", () => {
    const grounding = buildAssistantGrounding(
      "Which HVAC vendor works on Estates?",
      fixture,
    );

    expect(grounding.facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Vendor directory entry for Clear Air HVAC",
          href: "/vendors#vendor_clear_air",
          text: expect.stringContaining("Linked properties: Estates"),
        }),
      ]),
    );
  });

  it("adds generated document records to the grounding bundle", () => {
    const grounding = buildAssistantGrounding(
      "Show generated documents for Estates.",
      fixture,
    );

    expect(grounding.facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Generated document record for Owner Update - Estates",
          href: "/documents?generated=generated_estates_update",
          text: expect.stringContaining("Status: generated"),
        }),
      ]),
    );
  });

  it("returns a provider answer when citations come from the grounding bundle", async () => {
    const provider = vi.fn().mockResolvedValue({
      answer: "Clear Air HVAC completed HVAC maintenance at Estates.",
      citations: [
        {
          label: "Estates HVAC Maintenance Invoice",
          href: "https://drive.google.com/file/d/maintenance-estates",
        },
      ],
    });

    const answer = await answerGroundedPortfolioQuestion({
      question: "What maintenance has been completed at Estates?",
      input: fixture,
      provider,
    });

    expect(provider).toHaveBeenCalledWith(
      expect.objectContaining({
        question: "What maintenance has been completed at Estates?",
        fallbackAnswer: expect.objectContaining({
          answer:
            "From Estates HVAC Maintenance Invoice: HVAC maintenance completed at Estates by Clear Air HVAC.",
        }),
        grounding: expect.objectContaining({
          facts: expect.arrayContaining([
            expect.objectContaining({ label: "Estates HVAC Maintenance Invoice" }),
          ]),
        }),
      }),
    );
    expect(answer).toEqual({
      answer: "Clear Air HVAC completed HVAC maintenance at Estates.",
      citations: [
        {
          label: "Estates HVAC Maintenance Invoice",
          href: "https://drive.google.com/file/d/maintenance-estates",
        },
      ],
    });
  });

  it("falls back when a provider cites a source outside the grounding bundle", async () => {
    const answer = await answerGroundedPortfolioQuestion({
      question: "Who lives at Estates?",
      input: fixture,
      provider: vi.fn().mockResolvedValue({
        answer: "A made-up tenant lives there.",
        citations: [{ label: "Mystery PDF", href: "https://example.com/mystery" }],
      }),
    });

    expect(answer).toEqual({
      answer: "Olivia Martin lives at Estates.",
      citations: [
        {
          label: "Master spreadsheet row for Estates",
          href: "/houses/property_estates",
        },
      ],
    });
  });

  it("falls back when a provider answers without citations", async () => {
    const answer = await answerGroundedPortfolioQuestion({
      question: "What is the garage code at Wood Court?",
      input: fixture,
      provider: vi.fn().mockResolvedValue({
        answer: "The garage code is 1234.",
        citations: [],
      }),
    });

    expect(answer).toEqual({
      answer: "I could not find that in the indexed spreadsheet or Drive files.",
      citations: [],
    });
  });

  it("uses the deterministic assistant when no provider is configured", async () => {
    const answer = await answerGroundedPortfolioQuestion({
      question: "Which properties are vacant?",
      input: fixture,
    });

    expect(answer.answer).toBe("Vacant properties: Wood Court.");
  });

  it("does not call the provider for deterministic document generation actions", async () => {
    const provider = vi.fn();

    const answer = await answerGroundedPortfolioQuestion({
      question: "Generate a Move-In Checklist for Estates.",
      input: fixture,
      provider,
    });

    expect(provider).not.toHaveBeenCalled();
    expect(answer.citations[0]).toEqual({
      label: "Review and generate Move-In Checklist for Estates",
      href: "/documents?template=template_move_in&property=property_estates",
    });
  });
});
