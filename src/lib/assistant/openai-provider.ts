import type { AssistantAnswer, AssistantCitation } from "@/lib/assistant/portfolio-assistant";
import type {
  AssistantGroundingFact,
  GroundedAssistantProvider,
  GroundedAssistantProviderInput,
} from "@/lib/assistant/grounded-assistant";

type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.5";

export function createOpenAIGroundedAssistantProvider(input: {
  apiKey: string;
  fetcher?: Fetcher;
  model?: string;
}): GroundedAssistantProvider {
  const fetcher = input.fetcher ?? fetch;
  const model = input.model?.trim() || DEFAULT_MODEL;

  return async (providerInput) => {
    const response = await fetcher(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildResponsesRequestBody(providerInput, model)),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json().catch(() => null);
    const outputText = responseOutputText(payload);

    if (!outputText) {
      return null;
    }

    return parseAssistantAnswer(outputText);
  };
}

export function createConfiguredGroundedAssistantProvider(input?: {
  env?: Record<string, string | undefined>;
  fetcher?: Fetcher;
}): GroundedAssistantProvider | undefined {
  const env = input?.env ?? process.env;
  const apiKey = env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return undefined;
  }

  return createOpenAIGroundedAssistantProvider({
    apiKey,
    fetcher: input?.fetcher,
    model: env.OPENAI_MODEL,
  });
}

function buildResponsesRequestBody(
  input: GroundedAssistantProviderInput,
  model: string,
) {
  return {
    model,
    store: false,
    input: [
      {
        role: "system",
        content: [
          "You are the Almanac assistant for Example Property Group.",
          "Answer only from the provided grounding facts.",
          "If the answer is not present, say: I could not find that in the indexed spreadsheet or Drive files.",
          "Every factual answer must cite one or more provided citation hrefs.",
          "Do not invent people, properties, files, dates, amounts, or citations.",
        ].join(" "),
      },
      {
        role: "user",
        content: buildGroundedPrompt(input),
      },
    ],
    reasoning: { effort: "low" },
    text: {
      verbosity: "low",
      format: {
        type: "json_schema",
        name: "property_hub_assistant_answer",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            answer: { type: "string" },
            citations: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  label: { type: "string" },
                  href: { type: "string" },
                },
                required: ["label", "href"],
              },
            },
          },
          required: ["answer", "citations"],
        },
      },
    },
  };
}

function buildGroundedPrompt(input: GroundedAssistantProviderInput): string {
  return [
    `Question: ${input.question}`,
    "",
    "Grounding facts:",
    ...input.grounding.facts.map(formatFact),
    "",
    "Known deterministic fallback answer:",
    input.fallbackAnswer.answer,
  ].join("\n");
}

function formatFact(fact: AssistantGroundingFact): string {
  return [
    `- Label: ${fact.label}`,
    `  Href: ${fact.href}`,
    `  Text: ${fact.text.replace(/\s+/g, " ").trim()}`,
  ].join("\n");
}

function responseOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("output_text" in payload && typeof payload.output_text === "string") {
    return payload.output_text;
  }

  if (!("output" in payload) || !Array.isArray(payload.output)) {
    return null;
  }

  for (const outputItem of payload.output) {
    if (!outputItem || typeof outputItem !== "object") {
      continue;
    }

    if (!("content" in outputItem) || !Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (
        contentItem &&
        typeof contentItem === "object" &&
        "type" in contentItem &&
        contentItem.type === "output_text" &&
        "text" in contentItem &&
        typeof contentItem.text === "string"
      ) {
        return contentItem.text;
      }
    }
  }

  return null;
}

function parseAssistantAnswer(value: string): AssistantAnswer | null {
  try {
    const parsed = JSON.parse(value);

    if (!parsed || typeof parsed !== "object" || typeof parsed.answer !== "string") {
      return null;
    }

    if (!Array.isArray(parsed.citations)) {
      return null;
    }

    const parsedCitations: unknown[] = parsed.citations;
    const citations = parsedCitations.filter(isAssistantCitation);

    if (citations.length !== parsedCitations.length) {
      return null;
    }

    return {
      answer: parsed.answer,
      citations: citations.map((citation) => ({
        label: citation.label,
        href: citation.href,
      })),
    };
  } catch {
    return null;
  }
}

function isAssistantCitation(value: unknown): value is AssistantCitation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const citation = value as Record<string, unknown>;
  return typeof citation.label === "string" && typeof citation.href === "string";
}
