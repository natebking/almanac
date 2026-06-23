import { getDb } from "@/lib/db";
import {
  type AssistantAnswer,
  type AssistantCitation,
  type AssistantInput,
  type AssistantProperty,
} from "@/lib/assistant/portfolio-assistant";
import {
  answerGroundedPortfolioQuestion,
  type GroundedAssistantProvider,
} from "@/lib/assistant/grounded-assistant";
import { normalizeSearchText } from "@/lib/spreadsheet/property-rows";

const MAX_CONVERSATION_TITLE_LENGTH = 80;

export type AssistantConversationDraft = {
  title: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    citationsJson: string;
  }>;
};

export type BuildAssistantConversationDraftInput = {
  question: string;
  answer: AssistantAnswer;
};

export type AssistantConversationTurn = Pick<
  AssistantConversationDraft,
  "messages"
>;

type ConversationContextMessage = {
  role: string;
  content: string;
  citationsJson: string;
};

export function buildAssistantConversationDraft(
  input: BuildAssistantConversationDraftInput,
): AssistantConversationDraft {
  const question = input.question.replace(/\s+/g, " ").trim();

  return {
    title: conversationTitleForQuestion(question),
    messages: buildAssistantConversationTurn({
      question,
      answer: input.answer,
    }).messages,
  };
}

export function buildAssistantConversationTurn(
  input: BuildAssistantConversationDraftInput,
): AssistantConversationTurn {
  const question = input.question.replace(/\s+/g, " ").trim();

  return {
    messages: [
      {
        role: "user",
        content: question,
        citationsJson: "[]",
      },
      {
        role: "assistant",
        content: input.answer.answer,
        citationsJson: JSON.stringify(input.answer.citations),
      },
    ],
  };
}

export function conversationTitleForQuestion(question: string): string {
  const normalized = question.replace(/\s+/g, " ").trim();

  if (normalized.length <= MAX_CONVERSATION_TITLE_LENGTH) {
    return normalized || "Assistant question";
  }

  return `${normalized
    .slice(0, MAX_CONVERSATION_TITLE_LENGTH - 3)
    .trimEnd()}...`;
}

export function parseAssistantCitations(value: string): AssistantCitation[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is AssistantCitation =>
          Boolean(item) &&
          typeof item.label === "string" &&
          typeof item.href === "string",
      )
      .map((item) => ({ label: item.label, href: item.href }));
  } catch {
    return [];
  }
}

export function resolveAssistantConversationAnswer(input: {
  question: string;
  assistantInput: AssistantInput;
  provider?: GroundedAssistantProvider;
}) {
  return answerGroundedPortfolioQuestion({
    question: input.question,
    input: input.assistantInput,
    provider: input.provider,
  });
}

export async function createAssistantConversation(input: {
  userId: string;
  question: string;
  assistantInput: AssistantInput;
  provider?: GroundedAssistantProvider;
}) {
  const answer = await resolveAssistantConversationAnswer({
    question: input.question,
    assistantInput: input.assistantInput,
    provider: input.provider,
  });
  const draft = buildAssistantConversationDraft({
    question: input.question,
    answer,
  });
  const db = await getDb();

  return db.aiConversation.create({
    data: {
      userId: input.userId,
      title: draft.title,
      messages: {
        create: draft.messages,
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function appendAssistantConversationTurn(input: {
  userId: string;
  conversationId: string;
  question: string;
  assistantInput: AssistantInput;
  provider?: GroundedAssistantProvider;
}) {
  const db = await getDb();
  const conversation = await db.aiConversation.findFirst({
    where: { id: input.conversationId, userId: input.userId },
    select: {
      id: true,
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    return null;
  }

  const answerQuestion = questionWithConversationContext({
    question: input.question,
    assistantInput: input.assistantInput,
    messages: conversation.messages,
  });
  const answer = await resolveAssistantConversationAnswer({
    question: answerQuestion,
    assistantInput: input.assistantInput,
    provider: input.provider,
  });
  const turn = buildAssistantConversationTurn({
    question: input.question,
    answer,
  });

  return db.aiConversation.update({
    where: { id: conversation.id },
    data: {
      updatedAt: new Date(),
      messages: {
        create: turn.messages,
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

function questionWithConversationContext(input: {
  question: string;
  assistantInput: AssistantInput;
  messages: ConversationContextMessage[];
}) {
  const question = input.question.replace(/\s+/g, " ").trim();

  if (mentionsKnownProperty(question, input.assistantInput.properties)) {
    return question;
  }

  const property = mostRecentCitedProperty(
    input.messages,
    input.assistantInput.properties,
  );

  return property ? `${question} ${property.address}` : question;
}

function mentionsKnownProperty(
  question: string,
  properties: AssistantProperty[],
) {
  const normalizedQuestion = normalizeSearchText(question);

  return properties.some((property) =>
    normalizedQuestion.includes(normalizeSearchText(property.address)),
  );
}

function mostRecentCitedProperty(
  messages: ConversationContextMessage[],
  properties: AssistantProperty[],
) {
  const propertiesById = new Map(
    properties.map((property) => [property.id, property]),
  );

  for (const message of [...messages].reverse()) {
    for (const citation of parseAssistantCitations(message.citationsJson)) {
      const match = citation.href.match(/^\/houses\/([^/?#]+)/);

      if (!match) {
        continue;
      }

      const property = propertiesById.get(match[1]);
      if (property) {
        return property;
      }
    }
  }

  return null;
}

export async function getAssistantConversation(userId: string, id: string) {
  const db = await getDb();

  return db.aiConversation.findFirst({
    where: { id, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getRecentAssistantConversations(userId: string, take = 4) {
  const db = await getDb();

  return db.aiConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take,
  });
}
