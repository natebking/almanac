import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  const isClerkMode =
    process.env.AUTH_MODE === "clerk" &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY;

  return (
    <section className="auth-panel">
      <div className="auth-copy">
        <span className="brand-mark auth-brand-mark">A</span>
        <p className="muted-label">Almanac</p>
        <h1>Sign in to your property hub.</h1>
        <p>
          Use the account invited to this private alpha. Google Drive connects
          after sign-in.
        </p>
      </div>
      {isClerkMode ? (
        <SignIn />
      ) : (
        <div className="auth-mode-card">
          <p className="muted-label">Alpha mode</p>
          <h2>Login is disabled locally.</h2>
          <p>
            Set `AUTH_MODE=clerk` with Clerk keys to test invite-only login.
            Local alpha mode opens Almanac directly.
          </p>
          <Link className="primary-button" href="/">
            Open Almanac
          </Link>
        </div>
      )}
    </section>
  );
}
