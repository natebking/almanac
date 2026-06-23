import { describe, expect, it, vi } from "vitest";
import { buildGoogleWorkspaceDiagnostics } from "@/lib/google/diagnostics";
import {
  buildGoogleScopes,
  GOOGLE_SCOPES,
  OPTIONAL_GOOGLE_SCOPES,
} from "@/lib/google/scopes";

describe("Google workspace diagnostics", () => {
  it("reads Calendar event summaries and Gmail headers when optional scopes are granted", async () => {
    const adapter = {
      listCalendarEvents: vi.fn().mockResolvedValue([
        {
          id: "event_1",
          title: "Move-in walkthrough",
          start: "2026-06-18T16:00:00.000Z",
          end: "2026-06-18T16:30:00.000Z",
          htmlLink: "https://calendar.google.com/event?eid=event_1",
        },
      ]),
      listGmailMessageHeaders: vi.fn().mockResolvedValue([
        {
          id: "message_1",
          threadId: "thread_1",
          subject: "Lease question",
          from: "tenant@example.com",
          date: "Wed, 17 Jun 2026 10:00:00 -0700",
          labelIds: ["INBOX"],
        },
      ]),
    };

    const diagnostics = await buildGoogleWorkspaceDiagnostics({
      adapter,
      grantedScopes: [...OPTIONAL_GOOGLE_SCOPES],
      now: new Date("2026-06-17T12:00:00.000Z"),
    });

    expect(adapter.listCalendarEvents).toHaveBeenCalledWith({
      maxResults: 5,
      timeMin: "2026-06-17T12:00:00.000Z",
    });
    expect(adapter.listGmailMessageHeaders).toHaveBeenCalledWith({ maxResults: 5 });
    expect(diagnostics).toEqual({
      calendarEvents: [
        {
          id: "event_1",
          title: "Move-in walkthrough",
          start: "2026-06-18T16:00:00.000Z",
          end: "2026-06-18T16:30:00.000Z",
          htmlLink: "https://calendar.google.com/event?eid=event_1",
        },
      ],
      calendarError: null,
      gmailMessages: [
        {
          id: "message_1",
          threadId: "thread_1",
          subject: "Lease question",
          from: "tenant@example.com",
          date: "Wed, 17 Jun 2026 10:00:00 -0700",
          labelIds: ["INBOX"],
        },
      ],
      gmailError: null,
    });
  });

  it("does not call optional APIs when the account has not granted optional scopes", async () => {
    const adapter = {
      listCalendarEvents: vi.fn(),
      listGmailMessageHeaders: vi.fn(),
    };

    const diagnostics = await buildGoogleWorkspaceDiagnostics({
      adapter,
      grantedScopes: [],
      now: new Date("2026-06-17T12:00:00.000Z"),
    });

    expect(adapter.listCalendarEvents).not.toHaveBeenCalled();
    expect(adapter.listGmailMessageHeaders).not.toHaveBeenCalled();
    expect(diagnostics.calendarEvents).toEqual([]);
    expect(diagnostics.gmailMessages).toEqual([]);
    expect(diagnostics.calendarError).toContain("Reconnect Google");
    expect(diagnostics.gmailError).toContain("Reconnect Google");
  });

  it("keeps Calendar and Gmail failures isolated from each other", async () => {
    const adapter = {
      listCalendarEvents: vi.fn().mockRejectedValue(new Error("calendar denied")),
      listGmailMessageHeaders: vi.fn().mockResolvedValue([]),
    };

    const diagnostics = await buildGoogleWorkspaceDiagnostics({
      adapter,
      grantedScopes: [...OPTIONAL_GOOGLE_SCOPES],
      now: new Date("2026-06-17T12:00:00.000Z"),
    });

    expect(diagnostics.calendarEvents).toEqual([]);
    expect(diagnostics.calendarError).toBe(
      "Could not read Calendar diagnostics: calendar denied",
    );
    expect(diagnostics.gmailMessages).toEqual([]);
    expect(diagnostics.gmailError).toBeNull();
  });

  it("keeps optional diagnostics scopes out of the default Google consent", () => {
    expect(GOOGLE_SCOPES).not.toContain(
      "https://www.googleapis.com/auth/calendar.events.readonly",
    );
    expect(GOOGLE_SCOPES).not.toContain(
      "https://www.googleapis.com/auth/gmail.metadata",
    );
    expect(GOOGLE_SCOPES).not.toContain("https://mail.google.com/");
  });

  it("can request Gmail metadata diagnostics without requesting Gmail body scopes", () => {
    const diagnosticScopes = buildGoogleScopes({
      includeOptionalDiagnostics: true,
    });

    expect(diagnosticScopes).toContain(
      "https://www.googleapis.com/auth/gmail.metadata",
    );
    expect(diagnosticScopes).not.toContain(
      "https://www.googleapis.com/auth/gmail.readonly",
    );
    expect(diagnosticScopes).not.toContain("https://mail.google.com/");
  });
});
