import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  appendAssistantConversationTurn: vi.fn(),
  createAssistantConversation: vi.fn(),
  createConfiguredGroundedAssistantProvider: vi.fn(),
  getAlphaUser: vi.fn(),
  getAssistantInput: vi.fn(),
}));

vi.mock("@/lib/assistant/conversations", () => ({
  appendAssistantConversationTurn: mocks.appendAssistantConversationTurn,
  createAssistantConversation: mocks.createAssistantConversation,
}));

vi.mock("@/lib/assistant/openai-provider", () => ({
  createConfiguredGroundedAssistantProvider:
    mocks.createConfiguredGroundedAssistantProvider,
}));

vi.mock("@/lib/portfolio-data", () => ({
  getAssistantInput: mocks.getAssistantInput,
}));

vi.mock("@/lib/session", () => ({
  getAlphaUser: mocks.getAlphaUser,
}));

describe("assistant ask route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAlphaUser.mockResolvedValue({ id: "user_1" });
    mocks.getAssistantInput.mockResolvedValue({ properties: [], driveFiles: [] });
    mocks.createConfiguredGroundedAssistantProvider.mockReturnValue("provider");
    mocks.createAssistantConversation.mockResolvedValue({ id: "new_conversation" });
    mocks.appendAssistantConversationTurn.mockResolvedValue({
      id: "conversation_1",
    });
  });

  it("appends a follow-up question when a conversation id is posted", async () => {
    const { POST } = await import("@/app/api/assistant/ask/route");
    const response = await POST(
      new Request("http://localhost/api/assistant/ask", {
        method: "POST",
        body: new URLSearchParams({
          conversationId: "conversation_1",
          question: "What is the tenant phone number?",
        }),
      }),
    );

    expect(mocks.appendAssistantConversationTurn).toHaveBeenCalledWith({
      userId: "user_1",
      conversationId: "conversation_1",
      question: "What is the tenant phone number?",
      assistantInput: { properties: [], driveFiles: [] },
      provider: "provider",
    });
    expect(mocks.createAssistantConversation).not.toHaveBeenCalled();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/assistant?conversation=conversation_1",
    );
  });
});
