import { getProviderConfig, getProviderPersona } from "./server-env";

const ELEVENLABS_SIGNED_URL_ENDPOINT =
  "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url";
const ANAM_SESSION_TOKEN_ENDPOINT = "https://api.anam.ai/v1/auth/session-token";

type SessionRequestInput = {
  personaId?: unknown;
  userId?: unknown;
  dynamicVariables?: unknown;
};

type AvatarSession = {
  sessionToken: string;
  persona: {
    id: string;
    label: string;
  };
  providerTrace: {
    elevenLabsRequestId?: string;
    elevenLabsTraceId?: string;
    anamRequestId?: string;
  };
};

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asRecord(value: unknown): Record<string, string | number | boolean> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value).filter((entry): entry is [string, string | number | boolean] => {
    const field = entry[1];
    return ["string", "number", "boolean"].includes(typeof field);
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

async function readProviderError(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  return text.slice(0, 500) || response.statusText;
}

async function requestAnamSessionToken(
  anamApiKey: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(ANAM_SESSION_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anamApiKey}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export async function createAvatarSession(input: SessionRequestInput): Promise<AvatarSession> {
  const config = getProviderConfig();
  const persona = getProviderPersona(asOptionalString(input.personaId) ?? config.defaultPersonaId);
  const userId = asOptionalString(input.userId);
  const dynamicVariables = asRecord(input.dynamicVariables);

  if (!persona) {
    throw new Error("Missing session persona configuration");
  }

  const signedUrl = new URL(ELEVENLABS_SIGNED_URL_ENDPOINT);
  signedUrl.searchParams.set("agent_id", persona.agentId);

  const elevenLabsResponse = await fetch(signedUrl, {
    headers: {
      "xi-api-key": config.elevenLabsApiKey,
    },
    cache: "no-store",
  });

  if (!elevenLabsResponse.ok) {
    throw new Error(
      `ElevenLabs signed URL request failed (${elevenLabsResponse.status}): ${await readProviderError(elevenLabsResponse)}`,
    );
  }

  const elevenLabsPayload = (await elevenLabsResponse.json()) as { signed_url?: string };
  if (!elevenLabsPayload.signed_url) {
    throw new Error("ElevenLabs signed URL response did not include signed_url");
  }

  const elevenLabsAgentSettings: Record<string, unknown> = {
    signedUrl: elevenLabsPayload.signed_url,
    agentId: persona.agentId,
  };

  if (userId) {
    elevenLabsAgentSettings.userId = userId;
  }

  if (dynamicVariables) {
    elevenLabsAgentSettings.dynamicVariables = dynamicVariables;
  }

  const primaryPersonaConfig = persona.personaId
    ? { personaId: persona.personaId }
    : { avatarId: persona.avatarId };

  if (!primaryPersonaConfig.personaId && !primaryPersonaConfig.avatarId) {
    throw new Error("Missing persona configuration for Anam session token");
  }

  let anamResponse = await requestAnamSessionToken(config.anamApiKey, {
    personaConfig: primaryPersonaConfig,
    environment: {
      elevenLabsAgentSettings,
    },
  });

  // Some existing deployments stored persona IDs in the named vars before this repo normalized semantics.
  // If personaId fails validation, retry once as avatarId for backward compatibility.
  if (!anamResponse.ok && anamResponse.status === 400 && persona.personaId) {
    anamResponse = await requestAnamSessionToken(config.anamApiKey, {
      personaConfig: { avatarId: persona.personaId },
      environment: {
        elevenLabsAgentSettings,
      },
    });
  }

  if (!anamResponse.ok) {
    throw new Error(`Anam session token request failed (${anamResponse.status}): ${await readProviderError(anamResponse)}`);
  }

  const anamPayload = (await anamResponse.json()) as { sessionToken?: string };
  if (!anamPayload.sessionToken) {
    throw new Error("Anam session token response did not include sessionToken");
  }

  return {
    sessionToken: anamPayload.sessionToken,
    persona: {
      id: persona.id,
      label: persona.label,
    },
    providerTrace: {
      elevenLabsRequestId: elevenLabsResponse.headers.get("request-id") ?? undefined,
      elevenLabsTraceId: elevenLabsResponse.headers.get("x-trace-id") ?? undefined,
      anamRequestId: anamResponse.headers.get("request-id") ?? undefined,
    },
  };
}
