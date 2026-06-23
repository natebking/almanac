import { ClerkProvider } from "@clerk/nextjs";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (process.env.AUTH_MODE !== "clerk" || !hasClerkConfig()) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}

function hasClerkConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );
}
