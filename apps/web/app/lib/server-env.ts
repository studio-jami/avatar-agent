type ProviderConfig = {
  anamApiKey: string;
  elevenLabsApiKey: string;
  personas: ProviderPersona[];
  defaultPersonaId?: string;
};

type ProviderPersona = {
  id: string;
  label: string;
  avatarId: string;
  agentId: string;
  voiceId?: string;
};

type PublicPersona = {
  id: string;
  label: string;
};

type PublicRuntimeConfig = {
  providerReady: boolean;
  personas: PublicPersona[];
  defaultPersonaId?: string;
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

function titleFromKey(value: string): string {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function uniquePersonas(personas: ProviderPersona[]): ProviderPersona[] {
  const seen = new Set<string>();
  const unique: ProviderPersona[] = [];

  for (const persona of personas) {
    const fingerprint = `${persona.avatarId}::${persona.agentId}`;
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

  const namedKeys = (readEnv("AVATAR_PERSONA_KEYS") ?? "MEGAN,SARAH,ALEXIS")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

  const namedPersonas = namedKeys.flatMap((key): ProviderPersona[] => {
    const avatarId = readEnv(key);
    if (!avatarId) {
      return [];
    }

    const label = readEnv(`${key}_LABEL`) ?? titleFromKey(key);
    return [
      {
        id: safeId(label),
        label,
        avatarId,
        agentId: readEnv(`${key}_ELEVENLABS_AGENT_ID`) ?? agentId,
        voiceId: readEnv(`${key}_ELEVENLABS_VOICE_ID`) ?? readEnv("ELEVENLABS_VOICE_ID"),
      },
    ];
  });

  if (namedPersonas.length > 0) {
    return uniquePersonas(namedPersonas);
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

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
  const personas = getProviderPersonas();

  return {
    providerReady: Boolean(readEnv("ANAM_API_KEY") && readFirstEnv(["ELEVENLABS_API_KEY", "ELEVEN_LABS_API_KEY"]) && personas.length > 0),
    personas: personas.map((persona) => ({ id: persona.id, label: persona.label })),
    defaultPersonaId: personas[0]?.id,
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
