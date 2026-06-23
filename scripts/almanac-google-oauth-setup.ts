import dotenv from "dotenv";
import {
  buildGoogleOAuthSetupPlan,
  formatGoogleOAuthSetupPlan,
} from "../src/lib/google-oauth-setup";
import { alphaTesterEmail } from "../src/lib/alpha-config";

dotenv.config({ path: ".env", quiet: true });
dotenv.config({
  path: ".env.local",
  override: !process.env.VERCEL_ENV,
  quiet: true,
});

const plan = buildGoogleOAuthSetupPlan({
  appUrl: process.env.APP_URL || "https://almanac-alpha.example.com",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  testGoogleAccount: alphaTesterEmail,
  vercelScope: "vercel-team-placeholder",
});

process.stdout.write(formatGoogleOAuthSetupPlan(plan));

if (!plan.ready) {
  process.exitCode = 1;
}
