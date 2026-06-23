import { describe, expect, it, vi } from "vitest";
import {
  createConfiguredGroundedAssistantProvider,
  createOpenAIGroundedAssistantProvider,
} from "@/lib/assistant/openai-provider";
import type { GroundedAssistantProviderInput } from "@/lib/assistant/grounded-assistant";

const providerInput: GroundedAssistantProviderInput = {
  question: "Who lives at Estates?",
  fallbackAnswer: {
    answer: "Olivia Martin lives at Estates.",
    citations: [
      {
        label: "Master spreadsheet row for Estates",
        href: "/houses/property_estates",
      },
    ],
  },
  grounding: {
    question: "Who lives at Estates?",
    facts: [
      {
        label: "Master spreadsheet row for Estates",
        href: "/houses/property_estates",
        text: "Property: Estates\nTenant(s): Olivia Martin\nRent: $3,150",
      },
    ],
  },
};

function jsonResponse(body: unknown) {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}

describe("createOpenAIGroundedAssistantProvider", () => {
  it("calls the Responses API with grounded context and parses structured output", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  answer: "Olivia Martin lives at Estates.",
                  citations: [
                    {
                      label: "Master spreadsheet row for Estates",
                      href: "/houses/property_estates",
                    },
                  ],
                }),
              },
            ],
          },
        ],
      }),
    );
    const provider = createOpenAIGroundedAssistantProvider({
      apiKey: "sk-test",
      fetcher,
      model: "gpt-test",
    });

    const answer = await provider(providerInput);
    const [, init] = fetcher.mock.calls[0];
    const body = JSON.parse(String(init.body));

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test",
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(body.model).toBe("gpt-test");
    expect(body.store).toBe(false);
    expect(body.input[0].content).toContain(
      "Almanac assistant for Example Property Group",
    );
    expect(body.input[1].content).toContain("Who lives at Estates?");
    expect(body.input[1].content).toContain("Tenant(s): Olivia Martin");
    expect(body.text.format.type).toBe("json_schema");
    expect(answer).toEqual({
      answer: "Olivia Martin lives at Estates.",
      citations: [
        {
          label: "Master spreadsheet row for Estates",
          href: "/houses/property_estates",
        },
      ],
    });
  });

  it("returns null when OpenAI does not return valid structured output", async () => {
    const provider = createOpenAIGroundedAssistantProvider({
      apiKey: "sk-test",
      fetcher: vi.fn().mockResolvedValue(jsonResponse({ output: [] })),
    });

    await expect(provider(providerInput)).resolves.toBeNull();
  });

  it("creates a configured provider only when an API key is present", async () => {
    expect(
      createConfiguredGroundedAssistantProvider({
        env: {},
        fetcher: vi.fn(),
      }),
    ).toBeUndefined();

    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        output_text: JSON.stringify({
          answer: "Olivia Martin lives at Estates.",
          citations: [
            {
              label: "Master spreadsheet row for Estates",
              href: "/houses/property_estates",
            },
          ],
        }),
      }),
    );
    const provider = createConfiguredGroundedAssistantProvider({
      env: { OPENAI_API_KEY: " sk-test ", OPENAI_MODEL: "gpt-configured" },
      fetcher,
    });

    await provider?.(providerInput);

    expect(JSON.parse(String(fetcher.mock.calls[0][1].body)).model).toBe(
      "gpt-configured",
    );
  });
});
