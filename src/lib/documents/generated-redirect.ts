export type GeneratedDocumentRedirectMode = "print" | "review";

export type GeneratedDocumentRedirectSource = {
  id: string;
  pdfUrl: string | null;
  status: string;
};

export function generatedDocumentRedirectHref(
  input: GeneratedDocumentRedirectSource & {
    mode: GeneratedDocumentRedirectMode;
  },
) {
  if (input.mode === "print" && input.status === "generated" && input.pdfUrl) {
    return input.pdfUrl;
  }

  return `/documents?generated=${input.id}`;
}
