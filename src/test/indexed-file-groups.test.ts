import { describe, expect, it } from "vitest";
import { buildIndexedFileGroups } from "@/lib/files/indexed-file-groups";

describe("buildIndexedFileGroups", () => {
  it("groups indexed Drive files by linked property and keeps unlinked files last", () => {
    const groups = buildIndexedFileGroups([
      {
        id: "file_general",
        name: "Owner Statement Template",
        category: "financial",
        webViewLink: "https://drive.google.com/file/d/general",
        propertyIndex: null,
      },
      {
        id: "file_verona_new",
        name: "Verona June Statement",
        category: "financial",
        webViewLink: "https://drive.google.com/file/d/verona-new",
        propertyIndex: {
          id: "property_verona",
          address: "Verona",
        },
      },
      {
        id: "file_loch",
        name: "Loch Lomand Deposited Check",
        category: "financial",
        webViewLink: "https://drive.google.com/file/d/loch",
        propertyIndex: {
          id: "property_loch",
          address: "Loch Lomand",
        },
      },
      {
        id: "file_verona_old",
        name: "Verona May Statement",
        category: "financial",
        webViewLink: "https://drive.google.com/file/d/verona-old",
        propertyIndex: {
          id: "property_verona",
          address: "Verona",
        },
      },
    ]);

    expect(groups).toEqual([
      {
        key: "property_loch",
        title: "Loch Lomand",
        propertyHref: "/houses/property_loch",
        files: [
          {
            id: "file_loch",
            name: "Loch Lomand Deposited Check",
            category: "financial",
            webViewLink: "https://drive.google.com/file/d/loch",
            subtitle: "financial",
          },
        ],
      },
      {
        key: "property_verona",
        title: "Verona",
        propertyHref: "/houses/property_verona",
        files: [
          {
            id: "file_verona_new",
            name: "Verona June Statement",
            category: "financial",
            webViewLink: "https://drive.google.com/file/d/verona-new",
            subtitle: "financial",
          },
          {
            id: "file_verona_old",
            name: "Verona May Statement",
            category: "financial",
            webViewLink: "https://drive.google.com/file/d/verona-old",
            subtitle: "financial",
          },
        ],
      },
      {
        key: "general",
        title: "General",
        propertyHref: null,
        files: [
          {
            id: "file_general",
            name: "Owner Statement Template",
            category: "financial",
            webViewLink: "https://drive.google.com/file/d/general",
            subtitle: "financial",
          },
        ],
      },
    ]);
  });

  it("uses extracted text as a short subtitle when available", () => {
    const groups = buildIndexedFileGroups([
      {
        id: "file_project",
        name: "Kitchen Remodel Notes",
        category: "project",
        webViewLink: "https://drive.google.com/file/d/project",
        textExtract: "Vendor ordered cabinets. Waiting on delivery date.\nSecond paragraph.",
        propertyIndex: {
          id: "property_estates",
          address: "Estates",
        },
      },
    ]);

    expect(groups[0]?.files[0]?.subtitle).toBe("Vendor ordered cabinets. Waiting on delivery date.");
  });

  it("truncates long extracted text subtitles", () => {
    const groups = buildIndexedFileGroups([
      {
        id: "file_long",
        name: "Owner Update",
        category: "project",
        webViewLink: "https://drive.google.com/file/d/long",
        textExtract:
          "This update has a long first line that should stay readable inside a compact mobile file row without taking over the entire section.",
        propertyIndex: null,
      },
    ]);

    expect(groups[0]?.files[0]?.subtitle).toBe(
      "This update has a long first line that should stay readable inside a compact mobile file row without taking over the entire..."
    );
  });
});
