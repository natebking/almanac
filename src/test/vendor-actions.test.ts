import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    vendor: { update: vi.fn() },
    vendorPropertyLink: { deleteMany: vi.fn(), createMany: vi.fn() },
  };
  const fakeDb = {
    propertyIndex: { findMany: vi.fn() },
    vendor: { create: vi.fn() },
    $transaction: vi.fn(async (run: (client: typeof tx) => Promise<void>) => run(tx)),
  };

  return { fakeDb, tx };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => mocks.fakeDb),
}));

vi.mock("@/lib/session", () => ({
  getAlphaUser: vi.fn(async () => ({ id: "user_1" })),
}));

import { createVendor, updateVendor } from "@/lib/actions/vendors";

function vendorForm(propertyIndexIds: string[], id?: string) {
  const formData = new FormData();

  if (id) {
    formData.set("id", id);
  }
  formData.set("name", "Clear Air HVAC");
  for (const propertyIndexId of propertyIndexIds) {
    formData.append("propertyIndexIds", propertyIndexId);
  }

  return formData;
}

describe("vendor actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fakeDb.propertyIndex.findMany.mockResolvedValue([{ id: "property_own" }]);
  });

  it("links a new vendor only to the user's own properties", async () => {
    await createVendor(vendorForm(["property_own", "property_other_account"]));

    expect(mocks.fakeDb.propertyIndex.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        id: { in: ["property_own", "property_other_account"] },
      },
      select: { id: true },
    });
    expect(mocks.fakeDb.vendor.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        propertyLinks: { create: [{ propertyIndexId: "property_own" }] },
      }),
    });
  });

  it("drops another account's property when a vendor is updated", async () => {
    await updateVendor(
      vendorForm(["property_other_account", "property_own"], "vendor_1"),
    );

    expect(mocks.tx.vendor.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "vendor_1", userId: "user_1" } }),
    );
    expect(mocks.tx.vendorPropertyLink.createMany).toHaveBeenCalledWith({
      data: [{ vendorId: "vendor_1", propertyIndexId: "property_own" }],
    });
  });

  it("skips the ownership lookup when no properties are linked", async () => {
    await updateVendor(vendorForm([], "vendor_1"));

    expect(mocks.fakeDb.propertyIndex.findMany).not.toHaveBeenCalled();
    expect(mocks.tx.vendorPropertyLink.deleteMany).toHaveBeenCalledWith({
      where: { vendorId: "vendor_1" },
    });
    expect(mocks.tx.vendorPropertyLink.createMany).not.toHaveBeenCalled();
  });
});
