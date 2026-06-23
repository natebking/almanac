import { describe, expect, it } from "vitest";
import {
  groupPortfolioSearchResults,
  searchPortfolio,
} from "@/lib/search/portfolio-search";

const fixture = {
  properties: [
    {
      id: "property_loch",
      address: "Loch Lomand",
      currentTenants: "Avery Johnson",
      rentAmount: "$2,450",
      leaseEnd: "2026-12-31",
      tenantBirthdays: "Avery Johnson: June 20",
      status: "Active",
      driveFolderUrl: "https://drive.google.com/drive/folders/loch",
      profileText:
        "Fridge LG LFXS26973. Filter size 16x20x1. Gate: 2468. Garage: 1357.",
    },
  ],
  driveFiles: [
    {
      id: "drive_lease",
      name: "Loch Lomand Lease",
      category: "lease",
      webViewLink: "https://drive.google.com/file/d/lease",
      propertyIndexId: "property_loch",
    },
    {
      id: "drive_template",
      name: "Move-In Checklist",
      category: "template",
      webViewLink: "https://docs.google.com/document/d/template",
      propertyIndexId: null,
    },
    {
      id: "drive_warranty",
      name: "Dishwasher Repair Notes",
      category: "maintenance",
      webViewLink: "https://drive.google.com/file/d/warranty",
      propertyIndexId: "property_loch",
      textExtract: "Dishwasher warranty expires on 2027-05-10.",
    },
  ],
  vendors: [
    {
      id: "vendor_jim",
      name: "Jim's HVAC",
      trade: "HVAC",
      notes: "Worked on Loch Lomand.",
      propertyNames: ["Loch Lomand"],
    },
    {
      id: "vendor_clear_air",
      name: "Clear Air HVAC",
      trade: "HVAC",
      notes: "Seasonal filter service.",
      propertyNames: ["Estates"],
    },
  ],
  templates: [
    {
      id: "template_move_in",
      name: "Move-In Checklist",
      description: "Reusable move-in template.",
    },
  ],
  generatedDocuments: [
    {
      id: "generated_move_in",
      title: "Move-In Checklist - Loch Lomand",
      renderedBody: "Tenant Avery Johnson at Loch Lomand.",
    },
  ],
};

describe("searchPortfolio", () => {
  it("finds properties, files, vendors, and templates in one result set", () => {
    const results = searchPortfolio("Loch Lomand", fixture);

    expect(results.map((result) => result.type)).toEqual([
      "property",
      "drive-folder",
      "drive-file",
      "vendor",
      "generated-document",
    ]);
    expect(results[0]).toMatchObject({
      title: "Loch Lomand",
      href: "/houses/property_loch",
    });
  });

  it("returns template results instantly", () => {
    const results = searchPortfolio("Move-In Checklist", fixture);

    expect(results.map((result) => result.title)).toContain("Move-In Checklist");
    expect(results.some((result) => result.type === "template")).toBe(true);
    expect(results.some((result) => result.type === "drive-file")).toBe(true);
  });

  it("finds Drive files by indexed document text", () => {
    const results = searchPortfolio("warranty 2027", fixture);

    expect(results).toEqual([
      expect.objectContaining({
        type: "drive-file",
        title: "Dishwasher Repair Notes",
        source: "Google Drive index",
      }),
    ]);
    expect(results[0].subtitle).toContain("Dishwasher warranty expires");
  });

  it("finds properties by indexed profile facts", () => {
    const results = searchPortfolio("gate 2468", fixture);

    expect(results).toEqual([
      expect.objectContaining({
        type: "property",
        title: "Loch Lomand",
        source: "Master spreadsheet",
      }),
    ]);
  });

  it("finds properties by tenant birthday details", () => {
    const results = searchPortfolio("June birthday", fixture);

    expect(results).toEqual([
      expect.objectContaining({
        type: "property",
        title: "Loch Lomand",
        source: "Master spreadsheet",
      }),
    ]);
  });

  it("finds vendors by linked indexed property names", () => {
    const results = searchPortfolio("Estates", fixture);

    expect(results).toEqual([
      expect.objectContaining({
        type: "vendor",
        title: "Clear Air HVAC",
        subtitle: "HVAC - Estates",
      }),
    ]);
  });

  it("adds direct command actions for each searchable result type", () => {
    const [property] = searchPortfolio("Loch Lomand", fixture);
    const driveFolder = searchPortfolio("Loch Lomand", fixture).find(
      (result) => result.type === "drive-folder",
    );
    const [driveFile] = searchPortfolio("warranty 2027", fixture);
    const template = searchPortfolio("Move-In Checklist", fixture).find(
      (result) => result.type === "template",
    );
    const generatedDocument = searchPortfolio("Tenant Avery", fixture).find(
      (result) => result.type === "generated-document",
    );

    expect(property.actions).toEqual([
      {
        label: "Open house",
        href: "/houses/property_loch",
      },
      {
        label: "Drive folder",
        href: "https://drive.google.com/drive/folders/loch",
        target: "_blank",
      },
    ]);
    expect(driveFolder).toMatchObject({
      title: "Loch Lomand Drive folder",
      subtitle: "Google Drive folder",
      href: "https://drive.google.com/drive/folders/loch",
      source: "Google Drive",
      actions: [
        {
          label: "Open folder",
          href: "https://drive.google.com/drive/folders/loch",
          target: "_blank",
        },
        {
          label: "Open house",
          href: "/houses/property_loch",
        },
      ],
    });
    expect(driveFile.actions).toEqual([
      {
        label: "Open file",
        href: "https://drive.google.com/file/d/warranty",
        target: "_blank",
      },
      {
        label: "Open house",
        href: "/houses/property_loch",
      },
    ]);
    expect(template?.actions).toEqual([
      {
        label: "Generate",
        href: "/documents?template=template_move_in",
      },
    ]);
    expect(generatedDocument?.actions).toEqual([
      {
        label: "Review",
        href: "/documents?generated=generated_move_in",
      },
    ]);
  });

  it("groups results by type in a stable mobile scanning order", () => {
    const groups = groupPortfolioSearchResults(searchPortfolio("Loch Lomand", fixture));

    expect(groups.map((group) => group.label)).toEqual([
      "Properties",
      "Drive folders",
      "Drive files",
      "Vendors",
      "Generated documents",
    ]);
    expect(groups.map((group) => group.results.map((result) => result.title))).toEqual([
      ["Loch Lomand"],
      ["Loch Lomand Drive folder"],
      ["Loch Lomand Lease"],
      ["Jim's HVAC"],
      ["Move-In Checklist - Loch Lomand"],
    ]);
  });
});
