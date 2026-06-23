import { describe, expect, it } from "vitest";
import { buildAssistantAnswerDisplay } from "@/lib/assistant/answer-display";

describe("buildAssistantAnswerDisplay", () => {
  it("keeps a single-line assistant answer as the title", () => {
    expect(buildAssistantAnswerDisplay("Avery Johnson lives at Loch Lomand.")).toEqual({
      title: "Avery Johnson lives at Loch Lomand.",
      paragraphs: [],
      copyText: null,
    });
  });

  it("splits draft answers into a compact title, body paragraphs, and clean copy text", () => {
    expect(
      buildAssistantAnswerDisplay(
        [
          "Draft tenant text for Loch Lomand:",
          "Hi Avery Johnson, this is operator with Example Property Group about Loch Lomand.",
          "Review before sending.",
        ].join("\n\n"),
      ),
    ).toEqual({
      title: "Draft tenant text for Loch Lomand:",
      paragraphs: [
        "Hi Avery Johnson, this is operator with Example Property Group about Loch Lomand.",
        "Review before sending.",
      ],
      copyText:
        "Hi Avery Johnson, this is operator with Example Property Group about Loch Lomand.",
    });
  });

  it("does not expose copy text for non-draft multi-paragraph answers", () => {
    expect(
      buildAssistantAnswerDisplay(
        ["Generated documents for Loch Lomand:", "Move-In Checklist."].join("\n\n"),
      ),
    ).toEqual({
      title: "Generated documents for Loch Lomand:",
      paragraphs: ["Move-In Checklist."],
      copyText: null,
    });
  });
});
