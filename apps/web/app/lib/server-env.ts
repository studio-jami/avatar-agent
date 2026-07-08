type ProviderConfig = {
  anamApiKey: string;
  elevenLabsApiKey: string;
  personas: ProviderPersona[];
  defaultPersonaId?: string;
};

type ElevenLabsConfig = {
  apiKey: string;
  agentId: string;
  agentLabel: string;
};

type ProviderPersona = {
  id: string;
  label: string;
  avatarId?: string;
  agentId: string;
  voiceId?: string;
};

type PublicPersona = {
  id: string;
  label: string;
};

type ProviderSupport = {
  anam: boolean;
  elevenlabs: boolean;
};

type PublicRuntimeConfig = {
  providerReady: boolean;
  providerSupport: ProviderSupport;
  defaultProvider: "anam" | "elevenlabs" | null;
  personas: PublicPersona[];
  defaultPersonaId?: string;
  elevenLabsAgent?: { label: string };
};

type TelemetryConfig = {
  serviceName: string;
  postHogApiKey?: string;
  postHogHost?: string;
  amplitudeApiKey?: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readFirstEnv(names: string[]): string | undefined {
  for (const name of names) {
    const value = readEnv(name);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function safeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "default";
}

function uniquePersonas(personas: ProviderPersona[]): ProviderPersona[] {
  const seen = new Set<string>();
  const unique: ProviderPersona[] = [];

  for (const persona of personas) {
    const fingerprint = `${persona.avatarId ?? ""}::${persona.agentId}`;
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      unique.push(persona);
    }
  }

  return unique;
}

function readPersonaPresets(): ProviderPersona[] {
  const rawPresets = readEnv("AVATAR_AGENT_PRESETS");
  if (rawPresets) {
    const parsed = JSON.parse(rawPresets) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("AVATAR_AGENT_PRESETS must be a JSON array");
    }

    return uniquePersonas(parsed.flatMap((entry, index): ProviderPersona[] => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return [];
      }

      const preset = entry as Record<string, unknown>;
      const avatarId = typeof preset.avatarId === "string" ? preset.avatarId.trim() : "";
      const agentId = typeof preset.agentId === "string" ? preset.agentId.trim() : "";
      if (!avatarId || !agentId) {
        return [];
      }

      const label = typeof preset.label === "string" && preset.label.trim() ? preset.label.trim() : `Persona ${index + 1}`;
      const id = typeof preset.id === "string" && preset.id.trim() ? safeId(preset.id) : safeId(label);
      const voiceId = typeof preset.voiceId === "string" && preset.voiceId.trim() ? preset.voiceId.trim() : undefined;
      return [{ id, label, avatarId, agentId, voiceId }];
    }));
  }

  const agentId = readEnv("ELEVENLABS_AGENT_ID");
  if (!agentId) {
    return [];
  }

  const avatarId = readEnv("ANAM_AVATAR_ID");
  if (!avatarId) {
    return [];
  }

  const label = readEnv("AVATAR_PERSONA_NAME") ?? "Jami Studio";
  return uniquePersonas([
    {
      id: "default",
      label,
      avatarId,
      agentId,
      voiceId: readEnv("ELEVENLABS_VOICE_ID"),
    },
  ]);
}

export function getProviderPersonas(): ProviderPersona[] {
  return readPersonaPresets();
}

export function getProviderPersona(personaId?: string): ProviderPersona | undefined {
  const personas = getProviderPersonas();
  if (personas.length === 0) {
    return undefined;
  }

  if (!personaId) {
    return personas[0];
  }

  return personas.find((persona) => persona.id === personaId) ?? personas[0];
}

export function getProviderConfig(): ProviderConfig {
  const anamApiKey = readEnv("ANAM_API_KEY");
  const elevenLabsApiKey = readFirstEnv(["ELEVENLABS_API_KEY", "ELEVEN_LABS_API_KEY"]);
  const personas = getProviderPersonas();

  if (!anamApiKey || !elevenLabsApiKey || personas.length === 0) {
    const missing = [
      !anamApiKey ? "ANAM_API_KEY" : null,
      !elevenLabsApiKey ? "ELEVENLABS_API_KEY" : null,
      personas.length === 0 ? "provider persona" : null,
    ].filter(Boolean);

    throw new Error(`Missing provider environment: ${missing.join(", ")}`);
  }

  return {
    anamApiKey,
    elevenLabsApiKey,
    personas,
    defaultPersonaId: personas[0]?.id,
  };
}

export function getElevenLabsConfig(): ElevenLabsConfig {
  const apiKey = readFirstEnv(["ELEVENLABS_API_KEY", "ELEVEN_LABS_API_KEY"]);
  const agentId = readEnv("ELEVENLABS_AGENT_ID");

  if (!apiKey || !agentId) {
    const missing = [
      !apiKey ? "ELEVENLABS_API_KEY" : null,
      !agentId ? "ELEVENLABS_AGENT_ID" : null,
    ].filter(Boolean);

    throw new Error(`Missing ElevenLabs provider environment: ${missing.join(", ")}`);
  }

  return {
    apiKey,
    agentId,
    agentLabel: readEnv("ELEVENLABS_AGENT_NAME") ?? "ElevenLabs agent",
  };
}

export function getElevenLabsAgentLabel(): string | undefined {
  const agentId = readEnv("ELEVENLABS_AGENT_ID");
  if (!agentId) {
    return undefined;
  }

  return readEnv("ELEVENLABS_AGENT_NAME") ?? "ElevenLabs agent";
}

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
  const personas = getProviderPersonas();
  const elevenLabsReady = Boolean(readFirstEnv(["ELEVENLABS_API_KEY", "ELEVEN_LABS_API_KEY"]) && readEnv("ELEVENLABS_AGENT_ID"));
  const elevenLabsAgentLabel = getElevenLabsAgentLabel();
  const anamReady = Boolean(
    readEnv("ANAM_API_KEY") && readFirstEnv(["ELEVENLABS_API_KEY", "ELEVEN_LABS_API_KEY"]) && personas.length > 0,
  );
  const providerSupport: ProviderSupport = {
    anam: anamReady,
    elevenlabs: elevenLabsReady,
  };

  return {
    providerReady: anamReady || elevenLabsReady,
    providerSupport,
    defaultProvider: elevenLabsReady ? "elevenlabs" : anamReady ? "anam" : null,
    personas: personas.map((persona) => ({ id: persona.id, label: persona.label })),
    defaultPersonaId: personas[0]?.id,
    elevenLabsAgent: elevenLabsAgentLabel ? { label: elevenLabsAgentLabel } : undefined,
  };
}

export function getTelemetryConfig(): TelemetryConfig {
  return {
    serviceName: readEnv("OTEL_SERVICE_NAME") ?? "avatar-agent",
    postHogApiKey: readFirstEnv(["POSTHOG_API_KEY", "POSTHOG_KEY"]),
    postHogHost: readEnv("POSTHOG_HOST"),
    amplitudeApiKey: readEnv("AMPLITUDE_API_KEY"),
  };
}
