// Per-browser demo identity cookie. Each visitor to the public demo gets their
// own private sandbox keyed by this value (minted in src/proxy.ts, resolved in
// src/lib/session.ts). It lives in its own module so the edge proxy can import
// the name without pulling in the Node-only session/database code.
export const DEMO_USER_COOKIE = "almanac_demo_uid";
