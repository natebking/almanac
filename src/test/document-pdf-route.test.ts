import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const fakeDb = {
    generatedDocument: {
      findFirst: vi.fn(),
    },
  };

  return {
    fakeDb,
    exportDriveFilePdf: vi.fn(),
    getAuthorizedOAuthClient: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => mocks.fakeDb),
}));

vi.mock("@/lib/session", () => ({
  getAlphaUser: vi.fn(async () => ({ id: "user_1" })),
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
      exportDriveFilePdf: mocks.exportDriveFilePdf,
    };
  }),
}));

describe("generated document PDF route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fakeDb.generatedDocument.findFirst.mockResolvedValue({
      id: "generated_1",
      userId: "user_1",
      title: "Move-In Checklist - Loch Lomand",
      status: "generated",
      renderedBody: "Tenant: Avery Johnson",
      googleDocId: "google_doc_1",
      googleDocUrl: "https://docs.google.com/document/d/google_doc_1",
      pdfUrl: "/api/documents/pdf/generated_1",
      property: null,
      propertyIndex: { address: "Loch Lomand" },
      template: { name: "Move-In Checklist" },
    });
    mocks.getAuthorizedOAuthClient.mockResolvedValue({ client: {} });
    mocks.exportDriveFilePdf.mockResolvedValue(Uint8Array.from([37, 80, 68, 70]));
  });

  it("returns a Drive-exported PDF for real Google generated documents", async () => {
    const { GET } = await import("@/app/api/documents/pdf/[id]/route");

    const response = await GET(new Request("http://localhost/api/documents/pdf/generated_1"), {
      params: Promise.resolve({ id: "generated_1" }),
    });

    expect(mocks.exportDriveFilePdf).toHaveBeenCalledWith({
      fileId: "google_doc_1",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'inline; filename="Move-In Checklist - Loch Lomand.pdf"',
    );
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([
      37, 80, 68, 70,
    ]);
  });
});
