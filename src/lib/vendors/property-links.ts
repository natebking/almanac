export function propertyIndexIdsFromFormData(formData: FormData): string[] {
  return Array.from(
    new Set(
      formData
        .getAll("propertyIndexIds")
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  );
}

export function vendorPropertyLinkCreateData(propertyIndexIds: string[]) {
  return propertyIndexIds.map((propertyIndexId) => ({ propertyIndexId }));
}
