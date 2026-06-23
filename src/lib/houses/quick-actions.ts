export type HouseQuickActionState = "active" | "disabled" | "fallback";

export type HouseQuickAction = {
  label: string;
  key: string;
  state: HouseQuickActionState;
  href?: string;
  target?: "_blank";
};

export type HouseQuickActionDriveFile = {
  id: string;
  name: string;
  category: string;
  webViewLink: string;
};

export type HouseQuickActionTemplate = {
  id: string;
  name: string;
};

const FILE_ACTIONS = [
  { label: "Lease", key: "lease", category: "lease" },
  { label: "Application", key: "application", category: "application" },
  { label: "Photos", key: "photos", category: "photos" },
  { label: "Financial", key: "financial", category: "financial" },
  { label: "Maintenance", key: "maintenance", category: "maintenance" },
];

export function buildHouseQuickActions(input: {
  propertyId: string;
  propertyAddress: string;
  driveFolderUrl: string | null;
  driveFiles: HouseQuickActionDriveFile[];
  templates: HouseQuickActionTemplate[];
}): HouseQuickAction[] {
  const fileActions = FILE_ACTIONS.map((action) => {
    const file = input.driveFiles.find((item) => item.category === action.category);

    return file
      ? activeExternalAction(action.label, action.key, file.webViewLink)
      : fallbackAction(
          action.label,
          action.key,
          searchHref(input.propertyAddress, action.category),
        );
  });
  const moveInChecklistTemplate = input.templates.find(
    (template) => template.name === "Move-In Checklist",
  );
  const moveInChecklistAction = moveInChecklistTemplate
    ? {
        label: "Move-In Checklist",
        key: "move-in-checklist",
        state: "active" as const,
        href: documentGenerationHref(moveInChecklistTemplate.id, input.propertyId),
      }
    : fallbackAction(
        "Move-In Checklist",
        "move-in-checklist",
        searchHref(input.propertyAddress, "Move-In Checklist"),
      );
  const driveFolderAction = input.driveFolderUrl
    ? [activeExternalAction("Drive Folder", "drive-folder", input.driveFolderUrl)]
    : [];

  return [
    fileActions[0],
    fileActions[1],
    moveInChecklistAction,
    ...fileActions.slice(2),
    ...driveFolderAction,
  ];
}

function activeExternalAction(
  label: string,
  key: string,
  href: string,
): HouseQuickAction {
  return {
    label,
    key,
    state: "active",
    href,
    target: "_blank",
  };
}

function fallbackAction(
  label: string,
  key: string,
  href: string,
): HouseQuickAction {
  return {
    label,
    key,
    state: "fallback",
    href,
  };
}

function documentGenerationHref(templateId: string, propertyId: string) {
  const params = new URLSearchParams({
    template: templateId,
    property: propertyId,
  });

  return `/documents?${params.toString()}`;
}

function searchHref(propertyAddress: string, label: string) {
  const params = new URLSearchParams({
    q: `${propertyAddress} ${label}`,
  });

  return `/search?${params.toString()}`;
}
