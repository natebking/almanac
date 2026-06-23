import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const fakeDb = {
    documentTemplate: {
      findFirst: vi.fn(),
    },
    propertyIndex: {
      findFirst: vi.fn(),
    },
    property: {
      findFirst: vi.fn(),
    },
    generatedDocument: {
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  return {
    fakeDb,
    generateDocument: vi.fn(),
    getAuthorizedOAuthClient: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => mocks.fakeDb),
}));

vi.mock("@/lib/env", () => ({
  getEnv: () => ({ GOOGLE_MODE: "real" }),
}));

vi.mock("@/lib/google/oauth", () => ({
  getAuthorizedOAuthClient: mocks.getAuthorizedOAuthClient,
}));

vi.mock("@/lib/google/real-adapter", () => ({
  RealGoogleWorkspaceAdapter: vi.fn().mockImplementation(function () {
    return {
      generateDocument: mocks.generateDocument,
    };
  }),
}));

import { generateDocumentForUser } from "@/lib/documents/generate";

const template = {
  id: "template_move_in",
  userId: "user_1",
  name: "Move-In Checklist",
  description: "Move-in template.",
  googleDocId: "google_template_doc",
  googleDocUrl: "https://docs.google.com/document/d/google_template_doc",
  localBody: "Tenant: {{tenant_name}}\nAddress: {{property_address}}",
  placeholders: JSON.stringify(["tenant_name", "property_address"]),
  createdAt: new Date("2026-06-17T12:00:00.000Z"),
  updatedAt: new Date("2026-06-17T12:00:00.000Z"),
};

const propertyIndex = {
  id: "property_loch",
  userId: "user_1",
  sourceConnectionId: "source_1",
  sourceSpreadsheetId: "sheet_1",
  sourceSheetName: "Rentals",
  sourceRowNumber: 2,
  address: "Loch Lomand",
  normalizedAddress: "loch lomand",
  currentTenants: "Avery Johnson",
  rentAmount: "$2,450",
  leaseStart: "2026-01-01",
  leaseEnd: "2026-12-31",
  tenantPhone: "555-0144",
  tenantEmail: "avery@example.com",
  tenantBirthdays: "Avery Johnson: June 20",
  pets: "1 dog",
  owner: "Example Property Group",
  brokerSplit: "70 / 30",
  tenantNotes: "Prefers text messages.",
  status: "Active",
  driveFolderId: "folder_loch",
  driveFolderUrl: "https://drive.google.com/drive/folders/folder_loch",
  rawJson: "{}",
  createdAt: new Date("2026-06-17T12:00:00.000Z"),
  updatedAt: new Date("2026-06-17T12:00:00.000Z"),
  profile: null,
};

const propertyIndexWithoutDriveFolder = {
  ...propertyIndex,
  id: "property_wood",
  address: "Wood Court",
  normalizedAddress: "wood court",
  currentTenants: "",
  driveFolderId: null,
  driveFolderUrl: null,
};

describe("generateDocumentForUser failure records", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fakeDb.documentTemplate.findFirst.mockResolvedValue(template);
    mocks.fakeDb.propertyIndex.findFirst.mockResolvedValue(propertyIndex);
    mocks.fakeDb.property.findFirst.mockResolvedValue(null);
    mocks.getAuthorizedOAuthClient.mockResolvedValue({ client: {} });
    mocks.generateDocument.mockRejectedValue(new Error("Google copy failed"));
    mocks.fakeDb.generatedDocument.create.mockResolvedValue({
      id: "generated_error",
      userId: "user_1",
      propertyId: null,
      propertyIndexId: "property_loch",
      templateId: "template_move_in",
      title: "Move-In Checklist - Loch Lomand",
      status: "error",
      renderedBody: "Tenant: Avery Johnson\nAddress: Loch Lomand",
      fieldValuesJson: JSON.stringify({
        tenant_name: "Avery Johnson",
        property_address: "Loch Lomand",
      }),
      googleDocId: null,
      googleDocUrl: null,
      pdfUrl: null,
      errorMessage: "Google copy failed",
      property: null,
      propertyIndex,
      template,
    });
  });

  it("persists a failed generated document record when Google generation fails", async () => {
    const document = await generateDocumentForUser({
      userId: "user_1",
      templateId: "template_move_in",
      propertyIndexId: "property_loch",
      values: {},
    });

    expect(mocks.generateDocument).toHaveBeenCalledWith({
      templateDocId: "google_template_doc",
      title: "Move-In Checklist - Loch Lomand",
      folderId: "folder_loch",
      values: {
        tenant_name: "Avery Johnson",
        property_address: "Loch Lomand",
      },
    });
    expect(mocks.fakeDb.generatedDocument.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        propertyId: null,
        propertyIndexId: "property_loch",
        templateId: "template_move_in",
        title: "Move-In Checklist - Loch Lomand",
        status: "error",
        renderedBody: "Tenant: Avery Johnson\nAddress: Loch Lomand",
        fieldValuesJson: JSON.stringify({
          tenant_name: "Avery Johnson",
          property_address: "Loch Lomand",
        }),
        googleDocId: null,
        googleDocUrl: null,
        pdfUrl: null,
        errorMessage: "Google copy failed",
      }),
      include: {
        property: true,
        propertyIndex: true,
        template: true,
      },
    });
    expect(mocks.fakeDb.generatedDocument.update).not.toHaveBeenCalled();
    expect(document).toMatchObject({
      id: "generated_error",
      status: "error",
      errorMessage: "Google copy failed",
      pdfUrl: null,
    });
  });

  it("turns Google OAuth client failures into reconnect guidance", async () => {
    const reconnectMessage =
      "Google connection needs to be reconnected. Open Settings > Google, click Connect Google, then generate the document again.";

    mocks.generateDocument.mockRejectedValue(
      Object.assign(new Error("unauthorized_client"), {
        response: { data: { error: "unauthorized_client" } },
      }),
    );
    mocks.fakeDb.generatedDocument.create.mockImplementationOnce(
      async ({ data }) => ({
        id: "generated_reconnect_required",
        ...data,
        property: null,
        propertyIndex,
        template,
      }),
    );

    const document = await generateDocumentForUser({
      userId: "user_1",
      templateId: "template_move_in",
      propertyIndexId: "property_loch",
      values: {},
    });

    expect(mocks.fakeDb.generatedDocument.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "error",
        errorMessage: reconnectMessage,
      }),
      include: {
        property: true,
        propertyIndex: true,
        template: true,
      },
    });
    expect(document).toMatchObject({
      id: "generated_reconnect_required",
      status: "error",
      errorMessage: reconnectMessage,
      pdfUrl: null,
    });
  });

  it("does not call Google when a real generated document has no property Drive folder", async () => {
    mocks.fakeDb.propertyIndex.findFirst.mockResolvedValue(
      propertyIndexWithoutDriveFolder,
    );
    mocks.fakeDb.generatedDocument.create.mockResolvedValue({
      id: "generated_missing_folder",
      userId: "user_1",
      propertyId: null,
      propertyIndexId: "property_wood",
      templateId: "template_move_in",
      title: "Move-In Checklist - Wood Court",
      status: "error",
      renderedBody: "Tenant: \nAddress: Wood Court",
      fieldValuesJson: JSON.stringify({
        tenant_name: "",
        property_address: "Wood Court",
      }),
      googleDocId: null,
      googleDocUrl: null,
      pdfUrl: null,
      errorMessage: "Property Drive folder missing for Wood Court.",
      property: null,
      propertyIndex: propertyIndexWithoutDriveFolder,
      template,
    });

    const document = await generateDocumentForUser({
      userId: "user_1",
      templateId: "template_move_in",
      propertyIndexId: "property_wood",
      values: {},
    });

    expect(mocks.getAuthorizedOAuthClient).not.toHaveBeenCalled();
    expect(mocks.generateDocument).not.toHaveBeenCalled();
    expect(mocks.fakeDb.generatedDocument.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        propertyIndexId: "property_wood",
        title: "Move-In Checklist - Wood Court",
        status: "error",
        renderedBody: "Tenant: \nAddress: Wood Court",
        fieldValuesJson: JSON.stringify({
          tenant_name: "",
          property_address: "Wood Court",
        }),
        googleDocId: null,
        googleDocUrl: null,
        pdfUrl: null,
        errorMessage: "Property Drive folder missing for Wood Court.",
      }),
      include: {
        property: true,
        propertyIndex: true,
        template: true,
      },
    });
    expect(document).toMatchObject({
      id: "generated_missing_folder",
      status: "error",
      errorMessage: "Property Drive folder missing for Wood Court.",
      pdfUrl: null,
    });
  });
});
