import { describe, expect, it } from "vitest";
import { LocalGoogleWorkspaceAdapter } from "@/lib/google/local-adapter";

describe("LocalGoogleWorkspaceAdapter", () => {
  it("returns a local document URL without calling Google", async () => {
    const adapter = new LocalGoogleWorkspaceAdapter();
    const result = await adapter.generateDocument({
      templateDocId: "template_1",
      title: "Move-In Checklist - 123 Oak Street",
      values: { tenant_name: "Jordan Lee" },
    });

    expect(result.googleDocId).toContain("local-template_1");
    expect(result.googleDocUrl).toContain("/local-doc/");
  });

  it("returns empty text for local Drive text export", async () => {
    const adapter = new LocalGoogleWorkspaceAdapter();

    await expect(
      adapter.exportDriveFileText({
        fileId: "local-doc",
        mimeType: "application/vnd.google-apps.document",
      }),
    ).resolves.toBe("");
  });

  it("returns safe local Calendar and Gmail diagnostic metadata", async () => {
    const adapter = new LocalGoogleWorkspaceAdapter();

    const [events, messages] = await Promise.all([
      adapter.listCalendarEvents({
        maxResults: 5,
        timeMin: "2026-06-17T12:00:00.000Z",
      }),
      adapter.listGmailMessageHeaders({ maxResults: 5 }),
    ]);

    expect(events[0]).toEqual({
      id: "local-event-1",
      title: "Sample move-in walkthrough",
      start: "2026-06-18T16:00:00.000Z",
      end: "2026-06-18T16:30:00.000Z",
      htmlLink: null,
    });
    expect(messages[0]).toEqual({
      id: "local-message-1",
      threadId: "local-thread-1",
      subject: "Sample tenant question",
      from: "tenant@example.com",
      date: "Wed, 17 Jun 2026 10:00:00 -0700",
      labelIds: ["INBOX"],
    });
    expect(messages[0]).not.toHaveProperty("body");
  });
});
