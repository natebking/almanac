export type DashboardAttentionTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export type DashboardAttentionItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  label: string;
  tone: DashboardAttentionTone;
  priority: number;
};

export type DashboardAttentionProperty = {
  id: string;
  address: string;
  leaseStart: string;
  leaseEnd: string;
  status: string;
  tenantNotes: string;
};

export type DashboardAttentionProject = {
  id: string;
  name: string;
  webViewLink: string;
  propertyIndex: { address: string } | null;
};

export type DashboardAttentionDocument = {
  id: string;
  title: string;
  status: string;
  property: { address: string } | null;
  propertyIndex: { address: string } | null;
};

export function buildDashboardAttentionItems(input: {
  today: Date;
  properties: DashboardAttentionProperty[];
  projects: DashboardAttentionProject[];
  generatedDocuments: DashboardAttentionDocument[];
}): DashboardAttentionItem[] {
  const items = [
    ...leaseAttentionItems(input.properties, input.today),
    ...moveInAttentionItems(input.properties, input.today),
    ...vacancyAttentionItems(input.properties),
    ...projectAttentionItems(input.projects),
    ...documentAttentionItems(input.generatedDocuments),
  ];

  return items.sort(
    (left, right) =>
      left.priority - right.priority || left.title.localeCompare(right.title),
  );
}

function leaseAttentionItems(
  properties: DashboardAttentionProperty[],
  today: Date,
): DashboardAttentionItem[] {
  return properties.flatMap((property) => {
    const days = daysUntil(property.leaseEnd, today);

    if (days < 0 || days > 90) {
      return [];
    }

    return [
      {
        id: `lease-${property.id}`,
        title: `${property.address} lease expires`,
        subtitle: `${property.leaseEnd} - ${days} ${days === 1 ? "day" : "days"}`,
        href: `/houses/${property.id}`,
        label: "lease",
        tone: "warning",
        priority: 10,
      },
    ];
  });
}

function moveInAttentionItems(
  properties: DashboardAttentionProperty[],
  today: Date,
): DashboardAttentionItem[] {
  return properties.flatMap((property) => {
    const days = daysUntil(property.leaseStart, today);

    if (days < 0 || days > 30) {
      return [];
    }

    return [
      {
        id: `move-in-${property.id}`,
        title: `${property.address} move-in coming up`,
        subtitle: `${property.leaseStart} - ${days} ${days === 1 ? "day" : "days"}`,
        href: `/houses/${property.id}`,
        label: "move-in",
        tone: "success",
        priority: 15,
      },
    ];
  });
}

function vacancyAttentionItems(
  properties: DashboardAttentionProperty[],
): DashboardAttentionItem[] {
  return properties
    .filter((property) => property.status.toLowerCase().includes("vacant"))
    .map((property) => ({
      id: `vacant-${property.id}`,
      title: `${property.address} is vacant`,
      subtitle: property.tenantNotes || "No tenant listed",
      href: `/houses/${property.id}`,
      label: "vacant",
      tone: "info",
      priority: 20,
    }));
}

function projectAttentionItems(
  projects: DashboardAttentionProject[],
): DashboardAttentionItem[] {
  return projects.map((project) => ({
    id: `project-${project.id}`,
    title: project.name,
    subtitle: project.propertyIndex?.address ?? "General",
    href: project.webViewLink,
    label: "project",
    tone: "warning",
    priority: 30,
  }));
}

function documentAttentionItems(
  documents: DashboardAttentionDocument[],
): DashboardAttentionItem[] {
  return documents
    .filter((document) => document.status === "generated")
    .map((document) => {
      const propertyAddress =
        document.propertyIndex?.address ?? document.property?.address ?? "Property";

      return {
        id: `document-${document.id}`,
        title: document.title,
        subtitle: `${propertyAddress} - ready to review / print`,
        href: `/documents?generated=${document.id}`,
        label: "document",
        tone: "success",
        priority: 40,
      };
    });
}

function daysUntil(dateText: string, today: Date) {
  if (!dateText) {
    return Number.POSITIVE_INFINITY;
  }

  const date = new Date(`${dateText}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}
