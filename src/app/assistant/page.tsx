import Link from "next/link";
import { Bot, Search } from "lucide-react";
import { CopyDraftButton } from "@/components/copy-draft-button";
import { GeneratedDocumentActions } from "@/components/generated-document-actions";
import { SectionHeader } from "@/components/section-header";
import { getAssistantInput } from "@/lib/portfolio-data";
import { buildAssistantAnswerDisplay } from "@/lib/assistant/answer-display";
import {
  getAssistantConversation,
  getRecentAssistantConversations,
  parseAssistantCitations,
} from "@/lib/assistant/conversations";
import { assistantExamples } from "@/lib/assistant/examples";
import { answerPortfolioQuestion } from "@/lib/assistant/portfolio-assistant";
import {
  buildAssistantSourceCards,
  type AssistantSourceCard,
} from "@/lib/assistant/source-cards";
import { getAssistantToday } from "@/lib/assistant/today";
import { getAlphaUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string; message?: string; q?: string }>;
}) {
  const { conversation = "", message = "", q = "" } = await searchParams;
  const user = await getAlphaUser();
  const input = await getAssistantInput(user.id, getAssistantToday());
  const selectedConversation = conversation
    ? await getAssistantConversation(user.id, conversation)
    : null;
  // Exclude the conversation that is currently open: it already appears as the
  // thread above, so listing it again under "Recent" reads as a duplicate.
  const recentConversations = (
    await getRecentAssistantConversations(user.id, 6)
  )
    .filter((item) => item.id !== selectedConversation?.id)
    .slice(0, 5);
  const response = !selectedConversation && q ? answerPortfolioQuestion(q, input) : null;

  return (
    <div className="stack-xl">
      <section className="source-banner">
        <div>
          <p className="muted-label">Source-grounded assistant</p>
          <h1>Ask Almanac</h1>
          <p>
            Answers come from the indexed master spreadsheet, Google Drive metadata,
            and indexed document snippets. If the answer is not indexed, the
            assistant says so.
          </p>
        </div>
        <Bot size={34} />
      </section>

      {message ? <div className="notice danger">{message}</div> : null}

      <form action="/api/assistant/ask" className="search-form" method="post">
        {selectedConversation ? (
          <input name="conversationId" type="hidden" value={selectedConversation.id} />
        ) : null}
        <label className="field wide">
          <span>
            {selectedConversation ? "Ask a follow-up" : "Ask a portfolio question"}
          </span>
          <input
            defaultValue={selectedConversation ? "" : q}
            name="question"
            placeholder={
              selectedConversation
                ? "What else should I check?"
                : "Who lives at Loch Lomand?"
            }
            required
          />
        </label>
        <button className="primary-button" type="submit">
          <Search size={16} />
          {selectedConversation ? "Send" : "Ask"}
        </button>
      </form>

      {selectedConversation ? (
        <section className="content-section">
          <SectionHeader title={selectedConversation.title} />
          <div className="conversation-thread">
            {selectedConversation.messages.map((item) => (
              <div className={`message-bubble ${item.role}`} key={item.id}>
                <span>{item.role === "assistant" ? "Almanac" : "You"}</span>
                {item.role === "assistant" ? (
                  <AssistantAnswerText answer={item.content} compact />
                ) : (
                  <p>{item.content}</p>
                )}
                {item.role === "assistant" ? (
                  <AssistantSourceList
                    cards={buildAssistantSourceCards(
                      parseAssistantCitations(item.citationsJson),
                      input,
                    )}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : response ? (
        <section className="assistant-answer">
          <AssistantAnswerText answer={response.answer} />
          <AssistantSourceList
            cards={buildAssistantSourceCards(response.citations, input)}
          />
        </section>
      ) : (
        <section className="content-section">
          <SectionHeader title="Examples" />
          <div className="linked-list">
            {assistantExamples.map((example) => (
              <Link href={`/assistant?q=${encodeURIComponent(example)}`} key={example}>
                {example}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="content-section">
        <SectionHeader title="Recent conversations" />
        <div className="list-panel">
          {recentConversations.map((item) => (
            <div className="data-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>{formatDate(item.updatedAt)}</p>
              </div>
              <Link className="inline-link" href={`/assistant?conversation=${item.id}`}>
                Open
              </Link>
            </div>
          ))}
          {recentConversations.length === 0 ? (
            <p className="empty-state padded">No saved assistant conversations yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function AssistantAnswerText({
  answer,
  compact = false,
}: {
  answer: string;
  compact?: boolean;
}) {
  const display = buildAssistantAnswerDisplay(answer);
  const titleClassName = compact ? "assistant-answer-title compact" : "assistant-answer-title";

  return (
    <div className="assistant-answer-text">
      {compact ? (
        <strong className={titleClassName}>{display.title}</strong>
      ) : (
        <h2 className={titleClassName}>{display.title}</h2>
      )}
      {display.paragraphs.map((paragraph) => (
        <p className="assistant-answer-paragraph" key={paragraph}>
          {paragraph}
        </p>
      ))}
      {display.copyText ? <CopyDraftButton text={display.copyText} /> : null}
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function AssistantSourceList({ cards }: { cards: AssistantSourceCard[] }) {
  if (cards.length === 0) {
    return <p className="source-empty">No indexed source found.</p>;
  }

  return (
    <div className="source-card-list">
      {cards.map((card) => (
        <div
          className="source-card"
          key={`${card.sourceType}:${card.href}:${card.label}`}
        >
          <span>{card.sourceType}</span>
          <strong className="source-card-title">{card.label}</strong>
          <p>{card.detail}</p>
          {card.generatedActions ? (
            <GeneratedDocumentActions
              googleDocHref={card.generatedActions.googleDocHref}
              printHref={card.generatedActions.printHref}
              reviewHref={card.generatedActions.reviewHref}
            />
          ) : (
            <AssistantSourceAction card={card} />
          )}
        </div>
      ))}
    </div>
  );
}

function AssistantSourceAction({ card }: { card: AssistantSourceCard }) {
  if (card.target === "_blank") {
    return (
      <a
        className="source-card-action"
        href={card.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {card.actionLabel}
      </a>
    );
  }

  return (
    <Link className="source-card-action" href={card.href}>
      {card.actionLabel}
    </Link>
  );
}
