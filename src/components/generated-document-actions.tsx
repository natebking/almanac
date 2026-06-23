import Link from "next/link";
import { ExternalLink, FileText, Printer } from "lucide-react";

export function GeneratedDocumentActions({
  googleDocHref,
  printHref,
  printPrimary = false,
  reviewHref,
}: {
  googleDocHref?: string | null;
  printHref?: string | null;
  printPrimary?: boolean;
  reviewHref?: string | null;
}) {
  return (
    <div className="document-action-group">
      {reviewHref ? (
        <Link
          className="document-action document-action-primary"
          href={reviewHref}
        >
          <FileText size={16} />
          Review
        </Link>
      ) : null}
      {printHref ? (
        <a
          className={
            printPrimary
              ? "document-action document-action-primary"
              : "document-action document-action-secondary"
          }
          href={printHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Printer size={16} />
          Print PDF
        </a>
      ) : null}
      {googleDocHref ? (
        <a
          className="document-action document-action-quiet"
          href={googleDocHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink size={16} />
          Google Docs
        </a>
      ) : null}
    </div>
  );
}
