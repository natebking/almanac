import { isValidElement, type ReactElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

type ElementWithChildren = ReactElement<{
  children?: ReactNode;
  className?: string;
}>;

describe("setup required page", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("marks allowed users missing when the alpha tester's test Google account is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_fake");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_fake");
    vi.stubEnv("DATABASE_URL", "postgres://example");
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    vi.stubEnv("ALMANAC_ALLOWED_EMAILS", "operator@example.com,assistant@example.com");

    const { default: SetupRequiredPage } = await import(
      "@/app/setup-required/page"
    );
    const page = await SetupRequiredPage({
      searchParams: Promise.resolve({ reason: "missing-google-oauth" }),
    });

    expect(setupCheckText(page, "Allowed user emails")).toContain("Missing");
  });

  it("renders the alpha handoff commands needed to clear setup blockers", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_fake");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_fake");
    vi.stubEnv("DATABASE_URL", "postgres://example");
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    vi.stubEnv("ALMANAC_ALLOWED_EMAILS", "alpha-tester@example.com");

    const { default: SetupRequiredPage } = await import(
      "@/app/setup-required/page"
    );
    const page = await SetupRequiredPage({
      searchParams: Promise.resolve({ reason: "missing-google-oauth" }),
    });
    const text = collectText(page).join(" ");

    expect(text).toContain("Alpha handoff");
    expect(text).toContain("npm run alpha:google-oauth");
    expect(text).toContain("npm run alpha:readiness");
    expect(text).toContain("Almanac Test Portfolio");
    expect(text).toContain("Almanac Test Master Spreadsheet");
    expect(text).not.toContain("npm run alpha:fixture-bundle");
    expect(text).toContain("npm run alpha:invite-user -- --email operator@example.com");
  });
});

function setupCheckText(node: ReactNode, label: string): string {
  if (Array.isArray(node)) {
    return node.map((child) => setupCheckText(child, label)).find(Boolean) || "";
  }

  if (!isValidElement(node)) {
    return "";
  }

  const element = node as ElementWithChildren;
  if (element.props.className === "setup-check-row") {
    const text = collectText(element).join(" ");
    return text.includes(label) ? text : "";
  }

  return setupCheckText(element.props.children, label);
}

function collectText(node: ReactNode): string[] {
  if (Array.isArray(node)) {
    return node.flatMap(collectText);
  }

  if (typeof node === "string" || typeof node === "number") {
    return [String(node)];
  }

  if (!isValidElement(node)) {
    return [];
  }

  return collectText((node as ElementWithChildren).props.children);
}
