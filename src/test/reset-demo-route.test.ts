import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  deleteMany: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("../../prisma/seed", () => ({
  createSeedClient: vi.fn(async () => ({
    user: { findMany: mocks.findMany, deleteMany: mocks.deleteMany },
    $disconnect: mocks.disconnect,
  })),
}));

import { GET } from "@/app/api/cron/reset-demo/route";

describe("demo sandbox cleanup cron", () => {
  beforeEach(() => {
    vi.stubEnv("GOOGLE_MODE", "local");
    vi.stubEnv("AUTH_MODE", "alpha");
    vi.stubEnv("CRON_SECRET", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  it("deletes stale sandboxes in batches until none remain", async () => {
    mocks.findMany
      .mockResolvedValueOnce(Array.from({ length: 100 }, (_, index) => ({ id: `a${index}` })))
      .mockResolvedValueOnce([{ id: "b1" }, { id: "b2" }])
      .mockResolvedValueOnce([]);
    mocks.deleteMany
      .mockResolvedValueOnce({ count: 100 })
      .mockResolvedValueOnce({ count: 2 });

    const response = await GET(new Request("https://demo.almanac.homes/api/cron/reset-demo"));

    expect(await response.json()).toEqual({ ok: true, recycled: 102, remaining: false });
    expect(mocks.deleteMany).toHaveBeenCalledTimes(2);
    expect(mocks.deleteMany.mock.calls[0][0].where).toMatchObject({ email: null });
    expect(mocks.disconnect).toHaveBeenCalled();
  });

  it("refuses to run on a real deployment", async () => {
    vi.stubEnv("GOOGLE_MODE", "real");

    const response = await GET(new Request("https://example.com/api/cron/reset-demo"));

    expect(await response.json()).toEqual({ skipped: "not a sample-demo deployment" });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
