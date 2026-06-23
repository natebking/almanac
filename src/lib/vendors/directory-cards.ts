import type { DashboardAttentionTone } from "@/lib/dashboard/attention";

export type VendorDirectoryVendor = {
  id: string;
  name: string;
  trade: string;
  phone: string;
  email: string;
  notes: string;
  licenseStatus: string;
  insuranceStatus: string;
  propertyLinks: Array<{
    id: string;
    propertyIndexId: string | null;
    propertyIndex: { id: string; address: string } | null;
    property: { id: string; address: string } | null;
  }>;
};

export type VendorDirectoryDriveFile = {
  id: string;
  name: string;
  category: string;
  webViewLink: string;
  propertyIndexId: string | null;
  modifiedTime: Date | null;
};

export type VendorDirectoryCard = {
  id: string;
  name: string;
  trade: string;
  notes: string;
  complianceTone: DashboardAttentionTone;
  complianceLabel: string;
  contactActions: VendorDirectoryAction[];
  linkedProperties: VendorDirectoryAction[];
  relatedWork: VendorDirectoryWorkItem[];
};

export type VendorDirectoryAction = {
  id?: string;
  label: string;
  href: string;
};

export type VendorDirectoryWorkItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export function buildVendorDirectoryCards(input: {
  vendors: VendorDirectoryVendor[];
  driveFiles: VendorDirectoryDriveFile[];
}): VendorDirectoryCard[] {
  return input.vendors.map((vendor) => {
    const linkedProperties = vendor.propertyLinks.flatMap((link) => {
      if (link.propertyIndex) {
        return [
          {
            id: link.propertyIndex.id,
            label: link.propertyIndex.address,
            href: `/houses/${link.propertyIndex.id}`,
          },
        ];
      }

      if (link.property) {
        return [
          {
            id: link.property.id,
            label: link.property.address,
            href: `/properties#${link.property.id}`,
          },
        ];
      }

      return [];
    });
    const propertyAddressById = new Map(
      linkedProperties.map((property) => [property.id, property.label]),
    );
    const linkedPropertyIds = new Set(linkedProperties.map((property) => property.id));

    return {
      id: vendor.id,
      name: vendor.name,
      trade: vendor.trade,
      notes: vendor.notes,
      ...complianceSummary(vendor),
      contactActions: contactActions(vendor),
      linkedProperties,
      relatedWork: relatedWorkItems(
        input.driveFiles,
        linkedPropertyIds,
        propertyAddressById,
      ),
    };
  });
}

function contactActions(vendor: VendorDirectoryVendor): VendorDirectoryAction[] {
  return [
    vendor.phone ? { label: "Call", href: `tel:${vendor.phone}` } : null,
    vendor.email ? { label: "Email", href: `mailto:${vendor.email}` } : null,
  ].filter((action): action is VendorDirectoryAction => Boolean(action));
}

function complianceSummary(vendor: VendorDirectoryVendor): {
  complianceTone: DashboardAttentionTone;
  complianceLabel: string;
} {
  const licenseOnFile = vendor.licenseStatus.toLowerCase().includes("on file");
  const insuranceOnFile = vendor.insuranceStatus.toLowerCase().includes("on file");

  if (licenseOnFile && insuranceOnFile) {
    return {
      complianceTone: "success",
      complianceLabel: "License + insurance on file",
    };
  }

  return {
    complianceTone: "warning",
    complianceLabel: "Check license / insurance",
  };
}

function relatedWorkItems(
  driveFiles: VendorDirectoryDriveFile[],
  linkedPropertyIds: Set<string>,
  propertyAddressById: Map<string, string>,
): VendorDirectoryWorkItem[] {
  return driveFiles
    .filter((file): file is VendorDirectoryDriveFile & { propertyIndexId: string } =>
      Boolean(file.propertyIndexId && linkedPropertyIds.has(file.propertyIndexId)),
    )
    .sort(
      (left, right) =>
        dateValue(right.modifiedTime) - dateValue(left.modifiedTime) ||
        left.name.localeCompare(right.name),
    )
    .slice(0, 4)
    .map((file) => ({
      id: file.id,
      title: file.name,
      subtitle: `${file.category} - ${propertyAddressById.get(file.propertyIndexId) ?? "Property"}`,
      href: file.webViewLink,
    }));
}

function dateValue(date: Date | null) {
  return date?.getTime() ?? 0;
}
