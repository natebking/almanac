import { describe, expect, it } from "vitest";
import { assistantExamples } from "@/lib/assistant/examples";

describe("assistantExamples", () => {
  it("teaches spreadsheet facts, profile facts, document generation, and drafting", () => {
    expect(assistantExamples).toContain("What is the tenant email for Loch Lomand?");
    expect(assistantExamples).toContain(
      "What are the tenant notes for Loch Lomand?",
    );
    expect(assistantExamples).toContain(
      "How long has each tenant been in their house?",
    );
    expect(assistantExamples).toContain("What is the gate code at Loch Lomand?");
    expect(assistantExamples).toContain("Which tenants have birthdays this month?");
    expect(assistantExamples).toContain(
      "Summarize the rental application for Verona.",
    );
    expect(assistantExamples).toContain(
      "What maintenance has been completed at Estates?",
    );
    expect(assistantExamples).toContain("Which houses need new AC units?");
    expect(assistantExamples).toContain("Show financial files for St. Paul.");
    expect(assistantExamples).toContain("What templates are available?");
    expect(assistantExamples).toContain("Generate a Move-In Checklist for Loch Lomand.");
    expect(assistantExamples).toContain("Draft a tenant text for Loch Lomand.");
    expect(assistantExamples).toContain(
      "Generate a rent increase notice for Loch Lomand.",
    );
  });
});
