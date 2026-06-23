import { OPTIONAL_GOOGLE_SCOPES } from "@/lib/google/scopes";
import type {
  GoogleCalendarEventSummary,
  GoogleGmailMessageHeaderSummary,
  GoogleWorkspaceDiagnostics,
} from "@/lib/google/types";

type DiagnosticsAdapter = {
  listCalendarEvents(input: {
    maxResults: number;
    timeMin: string;
  }): Promise<GoogleCalendarEventSummary[]>;
  listGmailMessageHeaders(input: {
    maxResults: number;
  }): Promise<GoogleGmailMessageHeaderSummary[]>;
};

const CALENDAR_SCOPE = OPTIONAL_GOOGLE_SCOPES[0];
const GMAIL_SCOPE = OPTIONAL_GOOGLE_SCOPES[1];
const RECONNECT_MESSAGE = "Reconnect Google to approve optional diagnostics access.";

export async function buildGoogleWorkspaceDiagnostics(input: {
  adapter: DiagnosticsAdapter;
  grantedScopes: string[];
  now?: Date;
}): Promise<GoogleWorkspaceDiagnostics> {
  const now = input.now ?? new Date();
  const [calendarResult, gmailResult] = await Promise.all([
    readCalendarDiagnostics(input.adapter, input.grantedScopes, now),
    readGmailDiagnostics(input.adapter, input.grantedScopes),
  ]);

  return {
    calendarEvents: calendarResult.items,
    calendarError: calendarResult.error,
    gmailMessages: gmailResult.items,
    gmailError: gmailResult.error,
  };
}

async function readCalendarDiagnostics(
  adapter: DiagnosticsAdapter,
  grantedScopes: string[],
  now: Date,
): Promise<{ items: GoogleCalendarEventSummary[]; error: string | null }> {
  if (!hasScope(grantedScopes, CALENDAR_SCOPE)) {
    return { items: [], error: RECONNECT_MESSAGE };
  }

  try {
    return {
      items: await adapter.listCalendarEvents({
        maxResults: 5,
        timeMin: now.toISOString(),
      }),
      error: null,
    };
  } catch (error) {
    return {
      items: [],
      error: `Could not read Calendar diagnostics: ${errorMessage(error)}`,
    };
  }
}

async function readGmailDiagnostics(
  adapter: DiagnosticsAdapter,
  grantedScopes: string[],
): Promise<{ items: GoogleGmailMessageHeaderSummary[]; error: string | null }> {
  if (!hasScope(grantedScopes, GMAIL_SCOPE)) {
    return { items: [], error: RECONNECT_MESSAGE };
  }

  try {
    return {
      items: await adapter.listGmailMessageHeaders({ maxResults: 5 }),
      error: null,
    };
  } catch (error) {
    return {
      items: [],
      error: `Could not read Gmail diagnostics: ${errorMessage(error)}`,
    };
  }
}

function hasScope(grantedScopes: string[], expectedScope: string): boolean {
  return grantedScopes.some((scope) => scope === expectedScope);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
