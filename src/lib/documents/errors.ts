export const googleReconnectMessage =
  "Google connection needs to be reconnected. Open Settings > Google, click Connect Google, then generate the document again.";

export function generatedDocumentErrorMessage(error: unknown) {
  if (isGoogleReconnectError(error)) {
    return googleReconnectMessage;
  }

  return error instanceof Error && error.message.trim()
    ? error.message
    : "Document generation failed.";
}

export function formatGeneratedDocumentError(message: string | null | undefined) {
  if (!message) {
    return null;
  }

  return isGoogleReconnectText(message) ? googleReconnectMessage : message;
}

function isGoogleReconnectError(error: unknown) {
  return errorTextCandidates(error).some(isGoogleReconnectText);
}

function isGoogleReconnectText(text: string) {
  const normalized = text.toLowerCase();
  return ["unauthorized_client", "invalid_grant", "invalid_client"].some((code) =>
    normalized.includes(code),
  );
}

function errorTextCandidates(error: unknown): string[] {
  if (!error || typeof error !== "object") {
    return [];
  }

  const record = error as Record<string, unknown>;
  const response = record.response as
    | { data?: Record<string, unknown> }
    | undefined;
  const data = response?.data;

  return [
    error instanceof Error ? error.message : undefined,
    typeof record.message === "string" ? record.message : undefined,
    typeof record.code === "string" ? record.code : undefined,
    typeof data?.error === "string" ? data.error : undefined,
    typeof data?.error_description === "string"
      ? data.error_description
      : undefined,
  ].filter((text): text is string => Boolean(text));
}
