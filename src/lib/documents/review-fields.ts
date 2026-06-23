import {
  humanizePlaceholder,
  propertyPlaceholderDefaults,
  type DocumentPropertySource,
} from "@/lib/document-values";

export type DocumentReviewField = {
  key: string;
  label: string;
  defaultValue: string;
};

export function buildDocumentReviewFields(input: {
  placeholders: string[];
  property: DocumentPropertySource | null;
}): DocumentReviewField[] {
  const defaults = input.property ? propertyPlaceholderDefaults(input.property) : {};

  return input.placeholders.map((placeholder) => ({
    key: placeholder,
    label: humanizePlaceholder(placeholder),
    defaultValue: defaults[placeholder] ?? "",
  }));
}
