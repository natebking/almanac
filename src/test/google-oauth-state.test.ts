import { describe, expect, it } from "vitest";
import {
  createGoogleOAuthState,
  isValidGoogleOAuthState,
} from "@/lib/google/oauth";

describe("Google OAuth state", () => {
  it("generates URL-safe state values for OAuth redirects", () => {
    const state = createGoogleOAuthState();

    expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(state.length).toBeGreaterThanOrEqual(32);
  });

  it("accepts only the exact state value stored before redirect", () => {
    const state = createGoogleOAuthState();

    expect(isValidGoogleOAuthState(state, state)).toBe(true);
    expect(isValidGoogleOAuthState(`${state}x`, state)).toBe(false);
    expect(isValidGoogleOAuthState(state.slice(1), state)).toBe(false);
    expect(isValidGoogleOAuthState(null, state)).toBe(false);
    expect(isValidGoogleOAuthState(state, null)).toBe(false);
  });
});
