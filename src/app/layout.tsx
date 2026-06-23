import type { Metadata } from "next";
import { headers } from "next/headers";
import { Hanken_Grotesk } from "next/font/google";
import Script from "next/script";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/components/auth-provider";
import { MARKETING_HOSTS, isMarketingHost } from "@/lib/marketing-hosts";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
  display: "swap",
});

const themeInitScript = `
(() => {
  const browserThemeQuery = "(prefers-color-scheme: dark)";
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
  };

  try {
    const media = window.matchMedia(browserThemeQuery);
    const browserTheme = () => (media.matches ? "dark" : "light");
    const marketingHosts = ${JSON.stringify(MARKETING_HOSTS)};
    const isPublicLanding =
      window.location.pathname.startsWith("/open-source") ||
      marketingHosts.includes(window.location.host);

    if (isPublicLanding) {
      const syncPublicTheme = () => applyTheme(browserTheme());
      syncPublicTheme();
      if (media.addEventListener) {
        media.addEventListener("change", syncPublicTheme);
      } else if (media.addListener) {
        media.addListener(syncPublicTheme);
      }
      return;
    }

    const stored = window.localStorage.getItem("almanac-theme");
    const theme = stored === "light" || stored === "dark" ? stored : browserTheme();
    applyTheme(theme);
  } catch {
    applyTheme("light");
  }
})();
`;

export const metadata: Metadata = {
  title: "Almanac",
  description: "Mobile-first Google-native property operations hub.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // On the marketing host (almanac.homes) the apex is rewritten to the landing
  // page; render it WITHOUT the product chrome. The browser URL there is "/"
  // (rewrites are invisible to the client), so the shell can only be scoped
  // reliably by host, here on the server -- not by pathname in AppShell.
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? null;
  const marketing = isMarketingHost(host);

  return (
    <html className={hankenGrotesk.variable} lang="en" suppressHydrationWarning>
      <body>
        <Script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
          id="almanac-theme-init"
          strategy="beforeInteractive"
        />
        <AuthProvider>
          {marketing ? children : <AppShell>{children}</AppShell>}
        </AuthProvider>
      </body>
    </html>
  );
}
