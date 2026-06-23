import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  drive: vi.fn(),
  docs: vi.fn(),
  filesExport: vi.fn(),
  filesGet: vi.fn(),
}));

vi.mock("googleapis", () => ({
  google: {
    drive: mocks.drive,
    docs: mocks.docs,
  },
}));

import { RealGoogleWorkspaceAdapter } from "@/lib/google/real-adapter";

describe("RealGoogleWorkspaceAdapter", () => {
  it("exports a generated Google Doc as PDF bytes through Drive", async () => {
    const pdfBytes = Uint8Array.from([37, 80, 68, 70]);
    mocks.drive.mockReturnValue({
      files: {
        export: mocks.filesExport,
      },
    });
    mocks.filesExport.mockResolvedValue({
      data: pdfBytes.buffer,
    });

    const adapter = new RealGoogleWorkspaceAdapter({} as never);
    const result = await adapter.exportDriveFilePdf({ fileId: "generated_doc" });

    expect(mocks.drive).toHaveBeenCalledWith({ auth: {}, version: "v3" });
    expect(mocks.filesExport).toHaveBeenCalledWith(
      {
        fileId: "generated_doc",
        mimeType: "application/pdf",
      },
      {
        responseType: "arraybuffer",
      },
    );
    expect(Array.from(result ?? [])).toEqual([37, 80, 68, 70]);
  });

  it("downloads Markdown files as text blobs", async () => {
    mocks.drive.mockReturnValue({
      files: {
        get: mocks.filesGet,
      },
    });
    mocks.filesGet.mockResolvedValue({
      data: "# Loch Lomand\n\nClear Air HVAC replaced filters.",
    });

    const adapter = new RealGoogleWorkspaceAdapter({} as never);
    const result = await adapter.exportDriveFileText({
      fileId: "fixture_md",
      mimeType: "text/markdown",
    });

    expect(mocks.drive).toHaveBeenCalledWith({ auth: {}, version: "v3" });
    expect(mocks.filesGet).toHaveBeenCalledWith(
      {
        fileId: "fixture_md",
        alt: "media",
      },
      {
        responseType: "text",
      },
    );
    expect(result).toBe("# Loch Lomand\n\nClear Air HVAC replaced filters.");
  });
});
