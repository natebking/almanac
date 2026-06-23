export type AssistantAnswerDisplay = {
  title: string;
  paragraphs: string[];
  copyText: string | null;
};

export function buildAssistantAnswerDisplay(answer: string): AssistantAnswerDisplay {
  const parts = answer
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { title: "", paragraphs: [], copyText: null };
  }

  const [title, ...paragraphs] = parts;

  return {
    title,
    paragraphs,
    copyText: draftCopyText(title, paragraphs),
  };
}

function draftCopyText(title: string, paragraphs: string[]): string | null {
  if (!title.toLowerCase().startsWith("draft ") || paragraphs.length === 0) {
    return null;
  }

  const copyParts = paragraphs.filter(
    (paragraph) => paragraph.toLowerCase() !== "review before sending.",
  );

  return copyParts.length > 0 ? copyParts.join("\n\n") : null;
}
