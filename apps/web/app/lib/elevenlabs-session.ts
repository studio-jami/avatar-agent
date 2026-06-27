import { getElevenLabsConfig } from "./server-env";

const ELEVENLABS_CONVERSATION_TOKEN_ENDPOINT = "https://api.elevenlabs.io/v1/convai/conversation/token";

type ElevenLabsSession = {
  conversationToken: string;
  agent: {
    label: string;
  };
  providerTrace: {
    elevenLabsRequestId?: string;
    elevenLabsTraceId?: string;
  };
};

async function readProviderError(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  return text.slice(0, 500) || response.statusText;
}

export async function createElevenLabsConversationToken(): Promise<ElevenLabsSession> {
  const config = getElevenLabsConfig();
  const tokenUrl = new URL(ELEVENLABS_CONVERSATION_TOKEN_ENDPOINT);
  tokenUrl.searchParams.set("agent_id", config.agentId);

  const response = await fetch(tokenUrl, {
    headers: {
      "xi-api-key": config.apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs conversation token request failed (${response.status}): ${await readProviderError(response)}`);
  }

  const payload = (await response.json()) as { token?: string };
  if (!payload.token) {
    throw new Error("ElevenLabs conversation token response did not include token");
  }

  return {
    conversationToken: payload.token,
    agent: {
      label: config.agentLabel,
    },
    providerTrace: {
      elevenLabsRequestId: response.headers.get("request-id") ?? undefined,
      elevenLabsTraceId: response.headers.get("x-trace-id") ?? undefined,
    },
  };
}
