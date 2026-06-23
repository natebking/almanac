export function isTemplateSelected({
  templateId,
  selectedTemplateId,
}: {
  templateId: string;
  selectedTemplateId: string;
}) {
  return templateId === selectedTemplateId;
}

export function selectedPropertyForTemplate({
  templateId,
  selectedTemplateId,
  selectedPropertyId,
}: {
  templateId: string;
  selectedTemplateId: string;
  selectedPropertyId: string;
}) {
  return isTemplateSelected({ templateId, selectedTemplateId })
    ? selectedPropertyId
    : "";
}
