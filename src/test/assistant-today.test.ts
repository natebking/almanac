import { describe, expect, it } from "vitest";
import { getAssistantToday } from "@/lib/assistant/today";

describe("getAssistantToday", () => {
  it("uses the live clock when no assistant date override is configured", () => {
    const now = new Date("2026-06-18T09:15:00.000Z");

    expect(getAssistantToday({}, () => now)).toBe(now);
  });

  it("accepts a date-only assistant override as noon UTC", () => {
    expect(
      getAssistantToday(
        { ASSISTANT_TODAY: "2026-06-17" },
        () => new Date("2026-06-18T09:15:00.000Z"),
      ).toISOString(),
    ).toBe("2026-06-17T12:00:00.000Z");
  });

  it("falls back to the live clock when the assistant override is invalid", () => {
    const now = new Date("2026-06-18T09:15:00.000Z");

    expect(getAssistantToday({ ASSISTANT_TODAY: "not-a-date" }, () => now)).toBe(
      now,
    );
  });
});
