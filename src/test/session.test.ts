import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const fakeDb = {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    propertyIndex: {
      count: vi.fn(),
    },
  };

  return {
    currentUser: vi.fn(),
    cookies: vi.fn(),
    cookieGet: vi.fn(),
    seedSamplePortfolio: vi.fn(),
    fakeDb,
  };
});

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => mocks.fakeDb),
}));

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: mocks.currentUser,
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

vi.mock("../../prisma/seed", () => ({
  seedSamplePortfolio: mocks.seedSamplePortfolio,
}));

import { getCurrentUser } from "@/lib/session";

const originalEnv = process.env;

describe("session user resolution (clerk mode)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env = {
      ...originalEnv,
      DATABASE_URL: "file:./prisma/dev.db",
      AUTH_MODE: "clerk",
      ALMANAC_ALLOWED_EMAILS: "alpha-tester@example.com,alpha-tester@example.com",
      APP_URL: "http://localhost:3000",
      GOOGLE_MODE: "local",
      GOOGLE_REDIRECT_URI: "http://localhost:3000/api/google/callback",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("rejects Clerk users whose email is not on the Almanac alpha allowlist", async () => {
    mocks.currentUser.mockResolvedValue({
      id: "clerk_user_1",
      firstName: "Unlisted",
      lastName: "User",
      username: null,
      primaryEmailAddress: {
        emailAddress: "unlisted@example.com",
      },
      emailAddresses: [],
    });

    await expect(getCurrentUser()).rejects.toThrow(
      "This email is not allowed to access the Almanac alpha.",
    );

    expect(mocks.fakeDb.user.upsert).not.toHaveBeenCalled();
  });

  it("creates allowed Clerk users when no matching Almanac user exists", async () => {
    const savedUser = {
      id: "user_1",
      clerkUserId: "clerk_user_1",
      email: "alpha-tester@example.com",
      name: "Bay Summer",
    };
    mocks.currentUser.mockResolvedValue({
      id: "clerk_user_1",
      firstName: "Bay",
      lastName: "Summer",
      username: null,
      primaryEmailAddress: {
        emailAddress: "alpha-tester@example.com",
      },
      emailAddresses: [],
    });
    mocks.fakeDb.user.findUnique.mockResolvedValue(null);
    mocks.fakeDb.user.create.mockResolvedValue(savedUser);

    await expect(getCurrentUser()).resolves.toEqual(savedUser);

    expect(mocks.fakeDb.user.create).toHaveBeenCalledWith({
      data: {
        clerkUserId: "clerk_user_1",
        email: "alpha-tester@example.com",
        name: "Bay Summer",
      },
    });
  });

  it("attaches Clerk identity to an existing seeded user with the same email", async () => {
    const seededUser = {
      id: "seeded_user_1",
      clerkUserId: null,
      email: "alpha-tester@example.com",
      name: "the alpha tester Test",
    };
    const updatedUser = {
      ...seededUser,
      clerkUserId: "clerk_user_1",
      name: "Bay Summer",
    };
    mocks.currentUser.mockResolvedValue({
      id: "clerk_user_1",
      firstName: "Bay",
      lastName: "Summer",
      username: null,
      primaryEmailAddress: {
        emailAddress: "alpha-tester@example.com",
      },
      emailAddresses: [],
    });
    mocks.fakeDb.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(seededUser);
    mocks.fakeDb.user.update.mockResolvedValue(updatedUser);

    await expect(getCurrentUser()).resolves.toEqual(updatedUser);

    expect(mocks.fakeDb.user.update).toHaveBeenCalledWith({
      where: { id: "seeded_user_1" },
      data: {
        clerkUserId: "clerk_user_1",
        email: "alpha-tester@example.com",
        name: "Bay Summer",
      },
    });
    expect(mocks.fakeDb.user.upsert).not.toHaveBeenCalled();
    expect(mocks.fakeDb.user.create).not.toHaveBeenCalled();
  });
});

describe("demo sandbox resolution (alpha mode)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env = {
      ...originalEnv,
      DATABASE_URL: "file:./prisma/dev.db",
      AUTH_MODE: "alpha",
      APP_URL: "http://localhost:3000",
      GOOGLE_MODE: "local",
      GOOGLE_REDIRECT_URI: "http://localhost:3000/api/google/callback",
    };
    mocks.cookies.mockImplementation(async () => ({ get: mocks.cookieGet }));
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns the existing sandbox when the demo cookie maps to a user", async () => {
    const sandbox = { id: "demo-123", email: null, name: "Monty Banks" };
    mocks.cookieGet.mockReturnValue({ value: "demo-123" });
    mocks.fakeDb.user.findUnique.mockResolvedValue(sandbox);

    await expect(getCurrentUser()).resolves.toEqual(sandbox);

    expect(mocks.fakeDb.user.findUnique).toHaveBeenCalledWith({
      where: { id: "demo-123" },
    });
    expect(mocks.fakeDb.user.create).not.toHaveBeenCalled();
    expect(mocks.seedSamplePortfolio).not.toHaveBeenCalled();
  });

  it("creates a sandbox and clones the portfolio on first visit", async () => {
    const sandbox = { id: "demo-new", email: null, name: "Monty Banks" };
    mocks.cookieGet.mockReturnValue({ value: "demo-new" });
    mocks.fakeDb.user.findUnique.mockResolvedValue(null);
    mocks.fakeDb.user.create.mockResolvedValue(sandbox);
    mocks.fakeDb.propertyIndex.count.mockResolvedValue(0);

    await expect(getCurrentUser()).resolves.toEqual(sandbox);

    expect(mocks.fakeDb.user.create).toHaveBeenCalledWith({
      data: { id: "demo-new", name: "Monty Banks" },
    });
    expect(mocks.seedSamplePortfolio).toHaveBeenCalledWith(
      mocks.fakeDb,
      "demo-new",
    );
  });

  it("falls back to the shared user when no demo cookie is present", async () => {
    const shared = {
      id: "shared",
      email: "alpha-user@example.com",
      name: "Monty Banks",
    };
    mocks.cookieGet.mockReturnValue(undefined);
    mocks.fakeDb.user.upsert.mockResolvedValue(shared);
    mocks.fakeDb.propertyIndex.count.mockResolvedValue(6);

    await expect(getCurrentUser()).resolves.toEqual(shared);

    expect(mocks.fakeDb.user.upsert).toHaveBeenCalledWith({
      where: { email: "alpha-user@example.com" },
      update: {},
      create: { email: "alpha-user@example.com", name: "Monty Banks" },
    });
    expect(mocks.seedSamplePortfolio).not.toHaveBeenCalled();
  });
});
