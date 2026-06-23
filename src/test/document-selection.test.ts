import { describe, expect, it } from "vitest";
import {
  isTemplateSelected,
  selectedPropertyForTemplate,
} from "@/lib/documents/selection";

describe("document selection helpers", () => {
  it("selects the URL property only for the matching template", () => {
    expect(
      selectedPropertyForTemplate({
        templateId: "template_move_in",
        selectedTemplateId: "template_move_in",
        selectedPropertyId: "property_loch",
      }),
    ).toBe("property_loch");

    expect(
      selectedPropertyForTemplate({
        templateId: "template_welcome",
        selectedTemplateId: "template_move_in",
        selectedPropertyId: "property_loch",
      }),
    ).toBe("");
  });

  it("identifies the selected template from URL state", () => {
    expect(
      isTemplateSelected({
        templateId: "template_move_in",
        selectedTemplateId: "template_move_in",
      }),
    ).toBe(true);
    expect(
      isTemplateSelected({
        templateId: "template_welcome",
        selectedTemplateId: "template_move_in",
      }),
    ).toBe(false);
  });
});
