import { CheckCircle2, KeyRound } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { StatusPill } from "@/components/status-pill";
import type { SourceConnection } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import {
  getEnv,
  hasGoogleOAuthConfig,
  hasOptionalGoogleDiagnostics,
} from "@/lib/env";
import { buildGoogleWorkspaceDiagnostics } from "@/lib/google/diagnostics";
import { LocalGoogleWorkspaceAdapter } from "@/lib/google/local-adapter";
import { getAuthorizedOAuthClient } from "@/lib/google/oauth";
import { RealGoogleWorkspaceAdapter } from "@/lib/google/real-adapter";
import { buildGoogleScopes } from "@/lib/google/scopes";
import type {
  GoogleSourceCandidate,
  GoogleSourceCandidateKind,
  GoogleWorkspaceAdapter,
  GoogleWorkspaceDiagnostics,
} from "@/lib/google/types";
import { getAlphaUser } from "@/lib/session";
import {
  getMasterSpreadsheetColumnGuide,
  type MasterSpreadsheetColumnGuideSection,
} from "@/lib/spreadsheet/property-rows";
import { buildPortfolioSyncNoticeText } from "@/lib/sync/portfolio-sync-notice";
import {
  resolvePortfolioSourceConfig,
  type SourceConfigSource,
} from "@/lib/sync/source-config";

export const dynamic = "force-dynamic";

export default async function GoogleSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    sync?: string;
    message?: string;
    properties?: string;
    profiles?: string;
    files?: string;
    folders?: string;
    templates?: string;
    textExtracted?: string;
    textExtractFailed?: string;
    removed?: string;
    sources?: string;
    sheetQ?: string;
    folderQ?: string;
  }>;
}) {
  const params = await searchParams;
  const env = getEnv();
  const googleScopes = buildGoogleScopes({
    includeOptionalDiagnostics: hasOptionalGoogleDiagnostics(env),
  });
  const db = await getDb();
  const user = await getAlphaUser();
  const account = await db.googleAccount.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  const sources = await db.sourceConnection.findMany({
    where: { userId: user.id },
    orderBy: [{ kind: "asc" }, { updatedAt: "desc" }],
  });
  const sourceConfig = resolvePortfolioSourceConfig({ env, sources });
  const spreadsheetSource =
    sourceConfig.spreadsheetSource ??
    sources.find(
      (source) =>
        source.kind === "master-spreadsheet" &&
        source.googleFileId === sourceConfig.spreadsheetId,
    );
  const driveSource =
    sourceConfig.driveSource ??
    sources.find(
      (source) =>
        source.kind === "drive-root" &&
        source.googleFileId === sourceConfig.driveRootFolderId,
    );
  const syncReady = Boolean(
    env.GOOGLE_MODE === "real" &&
      account &&
      sourceConfig.spreadsheetId &&
      sourceConfig.sheetName &&
      sourceConfig.driveRootFolderId,
  );
  const picker = await getSourcePickerData({
    userId: user.id,
    realMode: env.GOOGLE_MODE === "real",
    connected: Boolean(account),
    sheetQ: params.sheetQ ?? "",
    folderQ: params.folderQ ?? "",
  });
  const workspaceDiagnostics = await getWorkspaceDiagnosticData({
    userId: user.id,
    realMode: env.GOOGLE_MODE === "real",
    connected: Boolean(account),
  });

  return (
    <div className="stack-xl">
      <SectionHeader title="Google connection" />
      <SyncNotice params={params} />
      <section className="form-panel">
        <div className="panel-title">
          <KeyRound size={18} />
          <h2>Workspace access</h2>
        </div>
        <div className="settings-grid">
          <div className="data-row">
            <div>
              <strong>Mode</strong>
              <p>{env.GOOGLE_MODE === "real" ? "Real Google" : "Local mock"}</p>
            </div>
            <StatusPill tone={env.GOOGLE_MODE === "real" ? "warning" : "info"}>
              {env.GOOGLE_MODE}
            </StatusPill>
          </div>
          <div className="data-row">
            <div>
              <strong>OAuth setup</strong>
              <p>
                {hasGoogleOAuthConfig(env)
                  ? "Client ID and secret are configured"
                  : "Client ID or secret is missing"}
              </p>
            </div>
            <StatusPill tone={hasGoogleOAuthConfig(env) ? "success" : "neutral"}>
              {hasGoogleOAuthConfig(env) ? "Ready" : "Local only"}
            </StatusPill>
          </div>
          <div className="data-row">
            <div>
              <strong>Account</strong>
              <p>{account?.googleEmail ?? "No Google account connected yet"}</p>
            </div>
            <StatusPill tone={account ? "success" : "neutral"}>
              {account ? "Connected" : "Not connected"}
            </StatusPill>
          </div>
        </div>
        <div className="button-row">
          <a className="primary-button" href="/api/google/start">
            <CheckCircle2 size={16} />
            Connect Google
          </a>
          <a className="secondary-button" href="/api/google/diagnostics" target="_blank">
            Diagnostics
          </a>
        </div>
        <p className="helper-text">
          Local mode lets the alpha generate documents without touching Google.
          Real mode will use copied test templates in your Google Drive and can
          index supported document text during portfolio sync.
        </p>
        <p className="helper-text">
          Requested scopes include read-only Drive content access so Search and
          Assistant can index snippets from the selected Drive root. Calendar
          and Gmail metadata diagnostics are optional and disabled by default.
        </p>
        <div className="scope-list">
          {googleScopes.map((scope) => (
            <code key={scope}>{scope}</code>
          ))}
        </div>
        <WorkspaceDiagnosticsPanel diagnostics={workspaceDiagnostics} />
      </section>

      <section className="form-panel">
        <div className="panel-title">
          <CheckCircle2 size={18} />
          <h2>Portfolio index sync</h2>
        </div>
        <div className="settings-grid">
          <div className="data-row">
            <div>
              <strong>Master spreadsheet</strong>
              <p>{sourceConfig.spreadsheetId || "Not configured"}</p>
            </div>
            <StatusPill tone={sourceConfig.spreadsheetId ? "success" : "neutral"}>
              {sourceConfig.sheetName || "No sheet"}
            </StatusPill>
          </div>
          <div className="data-row">
            <div>
              <strong>Drive root folder</strong>
              <p>{sourceConfig.driveRootFolderId || "Not configured"}</p>
            </div>
            <StatusPill tone={sourceConfig.driveRootFolderId ? "success" : "neutral"}>
              Drive root
            </StatusPill>
          </div>
          <div className="data-row">
            <div>
              <strong>Source setup</strong>
              <p>{sourceOriginText(sourceConfig.sourceOrigin)}</p>
            </div>
            <StatusPill tone={sourceConfig.sourceOrigin === "settings" ? "success" : "neutral"}>
              {sourceConfig.sourceOrigin}
            </StatusPill>
          </div>
          <SourceStatus label="Spreadsheet index" source={spreadsheetSource} />
          <SourceStatus label="Drive metadata index" source={driveSource} />
        </div>
        <form action="/api/sync/sources" className="form-grid compact" method="post">
          <label className="field wide">
            <span>Master spreadsheet URL or ID</span>
            <input
              defaultValue={sourceConfig.spreadsheetId}
              name="spreadsheetInput"
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
          </label>
          <label className="field">
            <span>Sheet tab name</span>
            <input
              defaultValue={sourceConfig.sheetName}
              name="sheetName"
              placeholder="Rentals"
            />
          </label>
          <label className="field wide">
            <span>Drive root folder URL or ID</span>
            <input
              defaultValue={sourceConfig.driveRootFolderId}
              name="driveRootInput"
              placeholder="https://drive.google.com/drive/folders/..."
            />
          </label>
          <div className="button-row">
            <button className="secondary-button" type="submit">
              Save sources
            </button>
          </div>
        </form>
        <div className="picker-grid">
          <SourceCandidateList
            candidates={picker.spreadsheets}
            error={picker.spreadsheetError}
            kind="master-spreadsheet"
            queryName="sheetQ"
            search={params.sheetQ ?? ""}
            sheetName={sourceConfig.sheetName || "Rentals"}
            title="Choose master spreadsheet"
          />
          <SourceCandidateList
            candidates={picker.folders}
            error={picker.folderError}
            kind="drive-root"
            queryName="folderQ"
            search={params.folderQ ?? ""}
            sheetName={sourceConfig.sheetName || "Rentals"}
            title="Choose Drive root folder"
          />
        </div>
        <form action="/api/sync/portfolio" className="button-row" method="post">
          <button className="primary-button" disabled={!syncReady} type="submit">
            <CheckCircle2 size={16} />
            Sync portfolio index
          </button>
        </form>
        <p className="helper-text">
          Sync reads the master spreadsheet, Drive metadata, and short text extracts
          from supported Google Docs and plain text files. It does not duplicate files.
        </p>
        {!syncReady ? (
          <p className="helper-text">
            To enable sync, set real Google mode, connect an account, and configure
            spreadsheet and Drive root IDs.
          </p>
        ) : null}
        <SpreadsheetColumnGuide sections={getMasterSpreadsheetColumnGuide()} />
      </section>
    </div>
  );
}

function SyncNotice({
  params,
}: {
  params: {
    sync?: string;
    message?: string;
    properties?: string;
    profiles?: string;
    files?: string;
    folders?: string;
    templates?: string;
    textExtracted?: string;
    textExtractFailed?: string;
    removed?: string;
    sources?: string;
  };
}) {
  if (params.sources === "ok") {
    return <div className="notice success">Google source setup saved.</div>;
  }

  if (params.sources === "choice-ok") {
    return <div className="notice success">Selected Google source saved.</div>;
  }

  if (params.sources === "error") {
    return (
      <div className="notice danger">
        {params.message ?? "Could not save Google source setup."}
      </div>
    );
  }

  if (params.sync === "ok") {
    return (
      <div className="notice success">
        {buildPortfolioSyncNoticeText(params)}
      </div>
    );
  }

  if (params.sync === "error") {
    return <div className="notice danger">{params.message ?? "Sync failed."}</div>;
  }

  return null;
}

function SourceCandidateList({
  candidates,
  error,
  kind,
  queryName,
  search,
  sheetName,
  title,
}: {
  candidates: GoogleSourceCandidate[];
  error: string | null;
  kind: "master-spreadsheet" | "drive-root";
  queryName: string;
  search: string;
  sheetName: string;
  title: string;
}) {
  return (
    <div className="picker-panel">
      <div className="section-header compact">
        <h3>{title}</h3>
      </div>
      <form action="/settings/google" className="search-form compact">
        <label className="field wide">
          <span>Search Google metadata</span>
          <input defaultValue={search} name={queryName} placeholder="Example Operator" />
        </label>
        <button className="secondary-button" type="submit">
          Search
        </button>
      </form>
      {error ? <p className="empty-state">{error}</p> : null}
      <div className="linked-list">
        {candidates.map((candidate) => (
          <div className="candidate-row" key={`${candidate.kind}-${candidate.id}`}>
            <div>
              <strong>{candidate.name}</strong>
              <p>{candidate.modifiedTime ? formatDate(new Date(candidate.modifiedTime)) : candidate.id}</p>
            </div>
            <form action="/api/sync/source-choice" method="post">
              <input name="kind" type="hidden" value={kind} />
              <input name="googleFileId" type="hidden" value={candidate.id} />
              <input name="name" type="hidden" value={candidate.name} />
              <input name="sheetName" type="hidden" value={sheetName} />
              <button className="secondary-button" type="submit">
                Use
              </button>
            </form>
          </div>
        ))}
        {!error && candidates.length === 0 ? (
          <p className="empty-state">No matching Google files found.</p>
        ) : null}
      </div>
    </div>
  );
}

function SourceStatus({
  label,
  source,
}: {
  label: string;
  source?: SourceConnection | SourceConfigSource;
}) {
  return (
    <div className="data-row">
      <div>
        <strong>{label}</strong>
        <p>{source?.lastSyncedAt ? formatDate(source.lastSyncedAt) : "Never synced"}</p>
      </div>
      <StatusPill tone={statusTone(source?.status)}>{source?.status ?? "missing"}</StatusPill>
    </div>
  );
}

function WorkspaceDiagnosticsPanel({
  diagnostics,
}: {
  diagnostics: GoogleWorkspaceDiagnostics | null;
}) {
  return (
    <div className="diagnostics-block">
      <div>
        <h3>Optional diagnostics</h3>
        <p className="helper-text">
          Calendar summaries and Gmail headers only. Email bodies are not requested.
        </p>
      </div>
      {!diagnostics ? (
        <p className="empty-state">Connect Google to run optional diagnostics.</p>
      ) : (
        <div className="diagnostics-grid">
          <DiagnosticList
            emptyText="No upcoming events returned."
            error={diagnostics.calendarError}
            items={diagnostics.calendarEvents.map((event) => ({
              id: event.id,
              title: event.title,
              detail: formatDateText(event.start),
              href: event.htmlLink,
            }))}
            title="Calendar"
          />
          <DiagnosticList
            emptyText="No recent Gmail headers returned."
            error={diagnostics.gmailError}
            items={diagnostics.gmailMessages.map((message) => ({
              id: message.id,
              title: message.subject || "No subject",
              detail: [message.from, formatDateText(message.date)]
                .filter(Boolean)
                .join(" - "),
              href: null,
            }))}
            title="Gmail metadata"
          />
        </div>
      )}
    </div>
  );
}

function DiagnosticList({
  emptyText,
  error,
  items,
  title,
}: {
  emptyText: string;
  error: string | null;
  items: Array<{ id: string; title: string; detail: string; href: string | null }>;
  title: string;
}) {
  return (
    <div className="diagnostic-list">
      <h4>{title}</h4>
      {error ? <p className="diagnostic-error">{error}</p> : null}
      {!error && items.length === 0 ? <p className="empty-state">{emptyText}</p> : null}
      {items.map((item) => (
        <div className="diagnostic-row" key={item.id}>
          {item.href ? (
            <a href={item.href} target="_blank">
              {item.title}
            </a>
          ) : (
            <strong>{item.title}</strong>
          )}
          <p>{item.detail || "No date returned"}</p>
        </div>
      ))}
    </div>
  );
}

function SpreadsheetColumnGuide({
  sections,
}: {
  sections: MasterSpreadsheetColumnGuideSection[];
}) {
  return (
    <div className="column-guide">
      {sections.map((section) => (
        <section className="column-guide-section" key={section.title}>
          <div>
            <h3>{section.title}</h3>
            <p>{section.description}</p>
          </div>
          <div className="column-guide-list">
            {section.fields.map((field) => (
              <div className="column-guide-row" key={field.label}>
                <div>
                  <strong>{field.label}</strong>
                  <span>{field.required ? "Required" : "Optional"}</span>
                </div>
                <div className="header-chip-list" aria-label={`${field.label} headers`}>
                  {field.acceptedHeaders.map((header) => (
                    <code key={header}>{header}</code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function sourceOriginText(origin: "settings" | "environment" | "missing") {
  if (origin === "settings") {
    return "Saved in this app";
  }

  if (origin === "environment") {
    return "Loaded from environment variables";
  }

  return "No source setup saved yet";
}

function statusTone(status?: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "synced" || status === "indexed" || status === "configured") {
    return "success";
  }

  if (status === "syncing") {
    return "warning";
  }

  if (status === "error") {
    return "danger";
  }

  return "neutral";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDateText(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDate(date);
}

async function getWorkspaceDiagnosticData(input: {
  userId: string;
  realMode: boolean;
  connected: boolean;
}): Promise<GoogleWorkspaceDiagnostics | null> {
  if (!input.realMode) {
    const env = getEnv();

    return buildGoogleWorkspaceDiagnostics({
      adapter: new LocalGoogleWorkspaceAdapter(),
      grantedScopes: buildGoogleScopes({
        includeOptionalDiagnostics: hasOptionalGoogleDiagnostics(env),
      }),
    });
  }

  if (!input.connected) {
    return null;
  }

  try {
    const { account, client } = await getAuthorizedOAuthClient(input.userId);

    return buildGoogleWorkspaceDiagnostics({
      adapter: new RealGoogleWorkspaceAdapter(client),
      grantedScopes: account.scopes?.split(" ").filter(Boolean) ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return {
      calendarEvents: [],
      calendarError: `Could not run Calendar diagnostics: ${message}`,
      gmailMessages: [],
      gmailError: `Could not run Gmail diagnostics: ${message}`,
    };
  }
}

async function getSourcePickerData(input: {
  userId: string;
  realMode: boolean;
  connected: boolean;
  sheetQ: string;
  folderQ: string;
}) {
  if (input.realMode && !input.connected) {
    return {
      spreadsheets: [],
      folders: [],
      spreadsheetError: "Connect Google to list spreadsheets.",
      folderError: "Connect Google to list Drive folders.",
    };
  }

  const adapter = await getPickerAdapter(input);
  const [spreadsheetResult, folderResult] = await Promise.all([
    listCandidateFiles(adapter, "spreadsheet", input.sheetQ),
    listCandidateFiles(adapter, "folder", input.folderQ),
  ]);

  return {
    spreadsheets: spreadsheetResult.files,
    folders: folderResult.files,
    spreadsheetError: spreadsheetResult.error,
    folderError: folderResult.error,
  };
}

async function getPickerAdapter(input: {
  userId: string;
  realMode: boolean;
}): Promise<GoogleWorkspaceAdapter> {
  if (!input.realMode) {
    return new LocalGoogleWorkspaceAdapter();
  }

  const { client } = await getAuthorizedOAuthClient(input.userId);
  return new RealGoogleWorkspaceAdapter(client);
}

async function listCandidateFiles(
  adapter: GoogleWorkspaceAdapter,
  kind: GoogleSourceCandidateKind,
  search: string,
): Promise<{ files: GoogleSourceCandidate[]; error: string | null }> {
  try {
    const result = await adapter.listSourceCandidates({ kind, search });
    return { files: result.files, error: null };
  } catch (error) {
    return {
      files: [],
      error: error instanceof Error ? error.message : "Could not list Google files.",
    };
  }
}
