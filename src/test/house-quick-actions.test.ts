import { describe, expect, it } from "vitest";
import { buildHouseQuickActions } from "@/lib/houses/quick-actions";

describe("buildHouseQuickActions", () => {
  it("builds file, template, and Drive-folder quick actions for a house page", () => {
    const actions = buildHouseQuickActions({
      propertyId: "property_loch",
      propertyAddress: "Loch Lomand",
      driveFolderUrl: "https://drive.google.com/drive/folders/folder_loch",
      driveFiles: [
        {
          id: "lease_file",
          name: "Loch Lomand Lease",
          category: "lease",
          webViewLink: "https://drive.google.com/file/d/lease_file",
        },
        {
          id: "maintenance_file",
          name: "Loch Lomand Dishwasher Repair",
          category: "maintenance",
          webViewLink: "https://drive.google.com/file/d/maintenance_file",
        },
      ],
      templates: [
        {
          id: "template_move_in",
          name: "Move-In Checklist",
        },
      ],
    });

    expect(actions).toEqual([
      {
        label: "Lease",
        key: "lease",
        state: "active",
        href: "https://drive.google.com/file/d/lease_file",
        target: "_blank",
      },
      {
        label: "Application",
        key: "application",
        state: "fallback",
        href: "/search?q=Loch+Lomand+application",
      },
      {
        label: "Move-In Checklist",
        key: "move-in-checklist",
        state: "active",
        href: "/documents?template=template_move_in&property=property_loch",
      },
      {
        label: "Photos",
        key: "photos",
        state: "fallback",
        href: "/search?q=Loch+Lomand+photos",
      },
      {
        label: "Financial",
        key: "financial",
        state: "fallback",
        href: "/search?q=Loch+Lomand+financial",
      },
      {
        label: "Maintenance",
        key: "maintenance",
        state: "active",
        href: "https://drive.google.com/file/d/maintenance_file",
        target: "_blank",
      },
      {
        label: "Drive Folder",
        key: "drive-folder",
        state: "active",
        href: "https://drive.google.com/drive/folders/folder_loch",
        target: "_blank",
      },
    ]);
  });

  it("links unavailable move-in checklist actions to scoped search", () => {
    const actions = buildHouseQuickActions({
      propertyId: "property_loch",
      propertyAddress: "Loch Lomand",
      driveFolderUrl: "",
      driveFiles: [],
      templates: [],
    });

    expect(actions.find((action) => action.key === "move-in-checklist")).toEqual({
      label: "Move-In Checklist",
      key: "move-in-checklist",
      state: "fallback",
      href: "/search?q=Loch+Lomand+Move-In+Checklist",
    });
  });
});
