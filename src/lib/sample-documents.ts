import { replacePlaceholders } from "@/lib/placeholders";

export type RenderLocalDocumentInput = {
  templateName: string;
  propertyAddress: string;
  body: string;
  values: Record<string, string>;
};

export type RenderedLocalDocument = {
  title: string;
  body: string;
};

export function renderLocalDocument(
  input: RenderLocalDocumentInput,
): RenderedLocalDocument {
  return {
    title: `${input.templateName} - ${input.propertyAddress}`,
    body: replacePlaceholders(input.body, input.values),
  };
}
