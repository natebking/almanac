import Link from "next/link";
import { Search } from "lucide-react";
import { GeneratedDocumentActions } from "@/components/generated-document-actions";
import { SectionHeader } from "@/components/section-header";
import { StatusPill } from "@/components/status-pill";
import { getPortfolioSearchInput } from "@/lib/portfolio-data";
import {
  groupPortfolioSearchResults,
  searchPortfolio,
  type PortfolioSearchResult,
} from "@/lib/search/portfolio-search";
import { getAlphaUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const user = await getAlphaUser();
  const input = await getPortfolioSearchInput(user.id);
  const results = searchPortfolio(q, input);
  const resultGroups = groupPortfolioSearchResults(results);

  return (
    <div className="stack-xl">
      <SectionHeader title="Search everything" />
      <form className="search-form" action="/search">
        <label className="field wide">
          <span>Search properties, tenants, vendors, templates, and Drive files</span>
          <input defaultValue={q} name="q" placeholder="Loch Lomand" />
        </label>
        <button className="primary-button" type="submit">
          <Search size={16} />
          Search
        </button>
      </form>

      <section className="content-section">
        <SectionHeader title={q ? `Results for "${q}"` : "Try a search"} />
        {q && results.length === 0 ? (
          <p className="empty-state">No indexed spreadsheet or Drive results found.</p>
        ) : null}
      </section>

      {resultGroups.map((group) => (
        <section className="content-section" key={group.type}>
          <SectionHeader title={`${group.label} (${group.results.length})`} />
          <div className="list-panel">
            {group.results.map((result, index) => (
              <SearchResultRow
                key={`${result.type}-${result.href}-${index}`}
                result={result}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SearchResultRow({ result }: { result: PortfolioSearchResult }) {
  return (
    <div className="data-row search-result-row">
      <div>
        <strong>{result.title}</strong>
        <p>{result.subtitle}</p>
      </div>
      <div className="button-row">
        <StatusPill tone={result.type === "property" ? "success" : "info"}>
          {result.type}
        </StatusPill>
        {result.type === "generated-document" ? (
          <GeneratedDocumentActions reviewHref={result.href} />
        ) : (
          result.actions.map((action) =>
            action.target === "_blank" ? (
              <a
                className="inline-link"
                href={action.href}
                key={`${action.label}-${action.href}`}
                target="_blank"
              >
                {action.label}
              </a>
            ) : (
              <Link
                className="inline-link"
                href={action.href}
                key={`${action.label}-${action.href}`}
              >
                {action.label}
              </Link>
            ),
          )
        )}
      </div>
    </div>
  );
}
