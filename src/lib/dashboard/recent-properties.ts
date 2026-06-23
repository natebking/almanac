import type { DashboardAttentionTone } from "@/lib/dashboard/attention";

export type RecentPropertyVisitRecord = {
  id: string;
  openedAt: Date;
  propertyIndex: {
    id: string;
    address: string;
    currentTenants: string;
    status: string;
  } | null;
};

export type RecentPropertyCard = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  status: string;
  tone: DashboardAttentionTone;
  openedAt: Date;
};

export function buildRecentPropertyCards(
  visits: RecentPropertyVisitRecord[],
): RecentPropertyCard[] {
  return visits
    .filter((visit): visit is RecentPropertyVisitRecord & {
      propertyIndex: NonNullable<RecentPropertyVisitRecord["propertyIndex"]>;
    } => Boolean(visit.propertyIndex))
    .sort((left, right) => right.openedAt.getTime() - left.openedAt.getTime())
    .map((visit) => ({
      id: visit.id,
      title: visit.propertyIndex.address,
      subtitle: visit.propertyIndex.currentTenants || visit.propertyIndex.status,
      href: `/houses/${visit.propertyIndex.id}`,
      status: visit.propertyIndex.status,
      tone: visit.propertyIndex.status.toLowerCase().includes("vacant")
        ? "warning"
        : "success",
      openedAt: visit.openedAt,
    }));
}
