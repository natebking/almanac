import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  appendAssistantConversationTurn,
  buildAssistantConversationDraft,
  buildAssistantConversationTurn,
  parseAssistantCitations,
  resolveAssistantConversationAnswer,
} from "@/lib/assistant/conversations";
import type { AssistantInput } from "@/lib/assistant/portfolio-assistant";

const mocks = vi.hoisted(() => {
  const fakeDb = {
    aiConversation: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };

  return { fakeDb };
});

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => mocks.fakeDb),
}));

const assistantInput: AssistantInput = {
  today: new Date("2026-06-17T12:00:00.000Z"),
  properties: [
    {
      id: "property_estates",
      address: "Estates",
      currentTenants: "Olivia Martin",
      rentAmount: "$3,150",
      leaseEnd: "2027-01-31",
      tenantPhone: "555-0181",
      status: "Active",
    },
    {
      id: "property_loch",
      address: "Loch Lomand",
      currentTenants: "Avery Johnson",
      rentAmount: "$2,450",
      leaseEnd: "2026-12-31",
      tenantPhone: "555-0144",
      status: "Active",
    },
  ],
  driveFiles: [],
};

describe("assistant conversation helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds a titled user and assistant message pair", () => {
    const draft = buildAssistantConversationDraft({
      question:
        "   What does the Estates maintenance document say about HVAC warranties and invoices this month?   ",
      answer: {
        answer: "From Estates HVAC Maintenance Invoice: HVAC maintenance completed.",
        citations: [
          {
            label: "Estates HVAC Maintenance Invoice",
            href: "https://drive.google.com/file/d/maintenance-estates",
          },
        ],
      },
    });

    expect(draft.title).toBe(
      "What does the Estates maintenance document say about HVAC warranties and invo...",
    );
    expect(draft.messages).toEqual([
      {
        role: "user",
        content:
          "What does the Estates maintenance document say about HVAC warranties and invoices this month?",
        citationsJson: "[]",
      },
      {
        role: "assistant",
        content: "From Estates HVAC Maintenance Invoice: HVAC maintenance completed.",
        citationsJson:
          '[{"label":"Estates HVAC Maintenance Invoice","href":"https://drive.google.com/file/d/maintenance-estates"}]',
      },
    ]);
  });

  it("builds a follow-up user and assistant message pair", () => {
    const turn = buildAssistantConversationTurn({
      question: "   What is the tenant phone number?   ",
      answer: {
        answer: "Tenant phone for Estates: 555-0181.",
        citations: [
          {
            label: "Master spreadsheet row for Estates",
            href: "/houses/property_estates",
          },
        ],
      },
    });

    expect(turn.messages).toEqual([
      {
        role: "user",
        content: "What is the tenant phone number?",
        citationsJson: "[]",
      },
      {
        role: "assistant",
        content: "Tenant phone for Estates: 555-0181.",
        citationsJson:
          '[{"label":"Master spreadsheet row for Estates","href":"/houses/property_estates"}]',
      },
    ]);
  });

  it("parses stored citation JSON defensively", () => {
    expect(
      parseAssistantCitations(
        '[{"label":"Lease","href":"https://drive.google.com/file/d/lease"}]',
      ),
    ).toEqual([
      {
        label: "Lease",
        href: "https://drive.google.com/file/d/lease",
      },
    ]);
    expect(parseAssistantCitations("not json")).toEqual([]);
  });

  it("resolves answers through a supplied grounded provider", async () => {
    const provider = vi.fn().mockResolvedValue({
      answer: "Olivia Martin lives at Estates.",
      citations: [
        {
          label: "Master spreadsheet row for Estates",
          href: "/houses/property_estates",
        },
      ],
    });

    const answer = await resolveAssistantConversationAnswer({
      question: "Who lives at Estates?",
      assistantInput,
      provider,
    });

    expect(provider).toHaveBeenCalledOnce();
    expect(answer.answer).toBe("Olivia Martin lives at Estates.");
  });

  it("appends a source-grounded follow-up turn to an owned conversation", async () => {
    const provider = vi.fn().mockResolvedValue({
      answer: "Tenant phone for Estates: 555-0181.",
      citations: [
        {
          label: "Master spreadsheet row for Estates",
          href: "/houses/property_estates",
        },
      ],
    });
    mocks.fakeDb.aiConversation.findFirst.mockResolvedValue({
      id: "conversation_1",
      messages: [],
    });
    mocks.fakeDb.aiConversation.update.mockResolvedValue({
      id: "conversation_1",
      title: "Who lives at Estates?",
      messages: [],
    });

    const conversation = await appendAssistantConversationTurn({
      userId: "user_1",
      conversationId: "conversation_1",
      question: "What is the tenant phone number?",
      assistantInput,
      provider,
    });

    expect(mocks.fakeDb.aiConversation.findFirst).toHaveBeenCalledWith({
      where: { id: "conversation_1", userId: "user_1" },
      select: {
        id: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    expect(mocks.fakeDb.aiConversation.update).toHaveBeenCalledWith({
      where: { id: "conversation_1" },
      data: {
        updatedAt: expect.any(Date),
        messages: {
          create: [
            {
              role: "user",
              content: "What is the tenant phone number?",
              citationsJson: "[]",
            },
            {
              role: "assistant",
              content: "Tenant phone for Estates: 555-0181.",
              citationsJson:
                '[{"label":"Master spreadsheet row for Estates","href":"/houses/property_estates"}]',
            },
          ],
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    expect(conversation?.id).toBe("conversation_1");
  });

  it("uses prior property citations as context for follow-up questions", async () => {
    mocks.fakeDb.aiConversation.findFirst.mockResolvedValue({
      id: "conversation_1",
      messages: [
        {
          role: "user",
          content: "Who lives at Loch Lomand?",
          citationsJson: "[]",
        },
        {
          role: "assistant",
          content: "Avery Johnson lives at Loch Lomand.",
          citationsJson:
            '[{"label":"Master spreadsheet row for Loch Lomand","href":"/houses/property_loch"}]',
        },
      ],
    });
    mocks.fakeDb.aiConversation.update.mockResolvedValue({
      id: "conversation_1",
      title: "Who lives at Loch Lomand?",
      messages: [],
    });

    await appendAssistantConversationTurn({
      userId: "user_1",
      conversationId: "conversation_1",
      question: "What is the tenant phone number?",
      assistantInput,
    });

    expect(mocks.fakeDb.aiConversation.update).toHaveBeenCalledWith({
      where: { id: "conversation_1" },
      data: {
        updatedAt: expect.any(Date),
        messages: {
          create: [
            {
              role: "user",
              content: "What is the tenant phone number?",
              citationsJson: "[]",
            },
            {
              role: "assistant",
              content: "The tenant phone number for Loch Lomand is 555-0144.",
              citationsJson:
                '[{"label":"Master spreadsheet row for Loch Lomand","href":"/houses/property_loch"}]',
            },
          ],
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  });
});
