import Link from "next/link";
import {
  BriefcaseBusiness,
  DollarSign,
  FileText,
  FolderKanban,
  Settings,
  UsersRound,
} from "lucide-react";
import { SectionHeader } from "@/components/section-header";

const links = [
  { href: "/financial", label: "Financial", detail: "Statements, checks, expenses", icon: DollarSign },
  { href: "/materials", label: "Materials", detail: "Tenant overview and reference docs", icon: FileText },
  { href: "/documents", label: "Templates", detail: "Reusable document templates", icon: FolderKanban },
  { href: "/vendors", label: "Vendors", detail: "Contractor database", icon: UsersRound },
  { href: "/projects", label: "Projects", detail: "Current remodels and work", icon: BriefcaseBusiness },
  { href: "/settings/google", label: "Google settings", detail: "Auth and diagnostics", icon: Settings },
];

export default function MorePage() {
  return (
    <div className="stack-xl">
      <SectionHeader title="More" />
      <section className="more-grid">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link className="more-link" href={item.href} key={item.href}>
              <Icon size={20} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
