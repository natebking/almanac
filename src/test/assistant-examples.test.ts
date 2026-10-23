import { describe, expect, it } from "vitest";
import {
  assistantPlaceholderQuestion,
  buildAssistantExamples,
} from "@/lib/assistant/examples";
import {
  answerPortfolioQuestion,
  type AssistantInput,
} from "@/lib/assistant/portfolio-assistant";

const input: AssistantInput = {
  today: new Date("2026-10-23T12:00:00.000Z"),
  properties: [
    {
      id: "baltic",
      address: "Baltic Avenue",
      currentTenants: "",
      rentAmount: "$0",
      leaseEnd: "",
      tenantPhone: "",
      status: "Vacant",
    },
    {
      id: "boardwalk",
      address: "Boardwalk",
      currentTenants: "Avery Johnson",
      rentAmount: "$2,450",
      leaseStart: "2026-01-01",
      leaseEnd: "2026-12-31",
      tenantPhone: "555-0144",
      tenantEmail: "avery@example.com",
      tenantNotes: "Prefers text messages.",
      status: "Active",
      profile: {
        applianceInfo: "",
        filterSize: "16x20x1",
        homeWarranty: "",
        hoaInfo: "",
        utilityProviders: "",
        accessCodes: "Gate: 2468.",
      },
    },
    {
      id: "park",
      address: "Park Place",
      currentTenants: "Mia Chen",
      rentAmount: "$2,850",
      leaseEnd: "2027-03-14",
      tenantPhone: "555-0199",
      status: "Active",
    },
  ],
  driveFiles: [
    {
      id: "app",
      name: "Park Place Application",
      category: "application",
      webViewLink: "https://drive.google.com/file/d/app",
      propertyIndexId: "park",
      textExtract: "Rental application for Park Place. Tenant Mia Chen.",
    },
  ],
  templates: [{ id: "t1", name: "Move-In Checklist", description: "" }],
};

describe("buildAssistantExamples", () => {
  it("names houses from the portfolio instead of fixed sample houses", () => {
    const examples = buildAssistantExamples(input);

    expect(examples).toContain("Who lives at Boardwalk?");
    expect(examples).toContain("What is the gate code at Boardwalk?");
    expect(examples).toContain("Summarize the rental application for Park Place.");
    expect(examples).toContain("Generate a Move-In Checklist for Boardwalk.");
    expect(examples.join(" ")).not.toMatch(/Loch Lomand|Verona|Estates|St\. Paul/);
  });

  it("skips file questions the portfolio has no records for", () => {
    const examples = buildAssistantExamples(input);

    expect(examples.some((example) => example.includes("maintenance"))).toBe(false);
    expect(examples.some((example) => example.includes("financial"))).toBe(false);
  });

  it("only suggests house questions the assistant can answer", () => {
    const houseQuestions = buildAssistantExamples(input).filter((example) =>
      /Boardwalk|Park Place/.test(example),
    );

    for (const question of houseQuestions) {
      expect(answerPortfolioQuestion(question, input).answer, question).not.toContain(
        "could not find",
      );
    }
  });

  it("uses an occupied house for the input placeholder", () => {
    expect(assistantPlaceholderQuestion(input)).toBe("Who lives at Boardwalk?");
    expect(assistantPlaceholderQuestion({ ...input, properties: [] })).toBe(
      "Which leases expire within 90 days?",
    );
  });
});
