"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ClipboardList,
  FileText,
  House,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/", label: "Today", icon: ClipboardList },
  { href: "/houses", label: "Houses", icon: House },
  { href: "/search", label: "Search", icon: Search },
  { href: "/assistant", label: "AI", icon: Bot },
  { href: "/documents", label: "Templates", icon: FileText },
];

const moreRoutes = [
  "/more",
  "/financial",
  "/materials",
  "/vendors",
  "/projects",
  "/settings",
];

function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/setup-required");
  const isPublicRoute = pathname.startsWith("/open-source");
  const moreActive = moreRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return children;
  }

  if (isAuthRoute) {
    return (
      <>
        <div className="auth-theme-toggle">
          <ThemeToggle />
        </div>
        <main className="auth-main">{children}</main>
      </>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <House size={20} />
          </span>
          <span>
            <strong>Almanac</strong>
            <small>Property operations</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                className={active ? "nav-link active" : "nav-link"}
                href={item.href}
                key={item.href}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <Link
            className={moreActive ? "nav-link active" : "nav-link"}
            href="/more"
          >
            <MoreHorizontal size={18} />
            More
          </Link>
          <ThemeToggle />
        </div>
      </aside>

      <main className="app-main">{children}</main>
      <div className="mobile-theme-toggle">
        <Link
          className={moreActive ? "mobile-more-link active" : "mobile-more-link"}
          href="/more"
        >
          <MoreHorizontal size={18} />
          More
        </Link>
        <ThemeToggle />
      </div>

      <nav className="bottom-nav" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              className={active ? "bottom-link active" : "bottom-link"}
              href={item.href}
              key={item.href}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
