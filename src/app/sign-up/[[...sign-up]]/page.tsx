import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  const isClerkMode =
    process.env.AUTH_MODE === "clerk" &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY;

  return (
    <section className="auth-panel">
      <div className="auth-copy">
        <span className="brand-mark auth-brand-mark">A</span>
        <p className="muted-label">Almanac</p>
        <h1>Create your Almanac login.</h1>
        <p>
          This alpha is invite-only. Use the invitation email sent through
          Clerk.
        </p>
      </div>
      {isClerkMode ? (
        <SignUp />
      ) : (
        <div className="auth-mode-card">
          <p className="muted-label">Alpha mode</p>
          <h2>Invitations are disabled locally.</h2>
          <p>
            Set `AUTH_MODE=clerk` with Clerk keys to test invite-only signup.
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
