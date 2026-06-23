import { NextResponse } from "next/server";
import {
  appendAssistantConversationTurn,
  createAssistantConversation,
} from "@/lib/assistant/conversations";
import { createConfiguredGroundedAssistantProvider } from "@/lib/assistant/openai-provider";
import { getAssistantToday } from "@/lib/assistant/today";
import { getAssistantInput } from "@/lib/portfolio-data";
import { getAlphaUser } from "@/lib/session";

export async function POST(request: Request) {
  const formData = await request.formData();
  const conversationId = String(formData.get("conversationId") ?? "").trim();
  const question = String(formData.get("question") ?? "").trim();
  const redirectUrl = new URL("/assistant", request.url);

  if (!question) {
    redirectUrl.searchParams.set("message", "Ask a portfolio question first.");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  try {
    const user = await getAlphaUser();
    const assistantInput = await getAssistantInput(user.id, getAssistantToday());
    const provider = createConfiguredGroundedAssistantProvider();
    const conversation = conversationId
      ? await appendAssistantConversationTurn({
          userId: user.id,
          conversationId,
          question,
          assistantInput,
          provider,
        })
      : await createAssistantConversation({
          userId: user.id,
          question,
          assistantInput,
          provider,
        });

    if (!conversation) {
      redirectUrl.searchParams.set("message", "Assistant conversation not found.");
    } else {
      redirectUrl.searchParams.set("conversation", conversation.id);
    }
  } catch {
    redirectUrl.searchParams.set("message", "Assistant request failed.");
  }

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
