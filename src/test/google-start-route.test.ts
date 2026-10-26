import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/google/start/route";

describe("google start route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps the local-mode bounce on the visitor's host when APP_URL is unset", async () => {
    vi.stubEnv("DATABASE_URL", "file:./test.db");
    vi.stubEnv("GOOGLE_MODE", "local");
    vi.stubEnv("APP_URL", undefined);

    const response = await GET(
      new Request("https://demo.almanac.homes/api/google/start"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://demo.almanac.homes/settings/google?google=local",
    );
  });
});
