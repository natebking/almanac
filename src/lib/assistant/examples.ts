import type {
  AssistantDriveFile,
  AssistantInput,
  AssistantProperty,
} from "@/lib/assistant/portfolio-assistant";

// Example questions are built from the signed-in portfolio so every suggestion
// names a house that exists and has the record the question needs. A fixed
// list naming sample houses fails on any other portfolio, including the demo.
export function buildAssistantExamples(input: AssistantInput): string[] {
  const properties = [...input.properties].sort((left, right) =>
    left.address.localeCompare(right.address),
  );
  const occupied = properties.find((property) => property.currentTenants.trim());
  const withCodes = properties.find((property) => property.profile?.accessCodes.trim());
  const withApplication = propertyWithFile(properties, input.driveFiles, "application");
  const withMaintenance = propertyWithFile(properties, input.driveFiles, "maintenance");
  const withFinancial = propertyWithFile(properties, input.driveFiles, "financial");
  const template = input.templates?.[0];

  const examples: (string | null)[] = [
    occupied ? `Who lives at ${occupied.address}?` : null,
    occupied ? `What is the tenant email for ${occupied.address}?` : null,
    occupied ? `What are the tenant notes for ${occupied.address}?` : null,
    withCodes ? `What is the gate code at ${withCodes.address}?` : null,
    occupied ? "How long has each tenant been in their house?" : null,
    "Which leases expire within 90 days?",
    "Which move-ins are upcoming?",
    "Which tenants have birthdays this month?",
    withApplication
      ? `Summarize the rental application for ${withApplication.address}.`
      : null,
    withMaintenance
      ? `What maintenance has been completed at ${withMaintenance.address}?`
      : null,
    withFinancial ? `Show financial files for ${withFinancial.address}.` : null,
    template ? "What templates are available?" : null,
    template && occupied
      ? `Generate a ${template.name} for ${occupied.address}.`
      : null,
    occupied ? `Draft a tenant text for ${occupied.address}.` : null,
  ];

  return examples.filter((example): example is string => Boolean(example));
}

export function assistantPlaceholderQuestion(input: AssistantInput): string {
  const occupied = input.properties.find((property) => property.currentTenants.trim());
  return occupied ? `Who lives at ${occupied.address}?` : "Which leases expire within 90 days?";
}

function propertyWithFile(
  properties: AssistantProperty[],
  files: AssistantDriveFile[],
  category: string,
): AssistantProperty | undefined {
  return properties.find((property) =>
    files.some(
      (file) =>
        file.category === category &&
        file.propertyIndexId === property.id &&
        Boolean(file.textExtract?.trim()),
    ),
  );
}
