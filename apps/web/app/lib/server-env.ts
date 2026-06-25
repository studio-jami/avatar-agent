type ProviderConfig = {
  anamApiKey: string;
  elevenLabsApiKey: string;
  defaultAvatarId?: string;
  defaultAgentId?: string;
};

type PublicRuntimeConfig = {
  hasAnamApiKey: boolean;
  hasElevenLabsApiKey: boolean;
  hasDefaultAvatarId: boolean;
  hasDefaultAgentId: boolean;
  hasSentryDsn: boolean;
  hasPostHogKey: boolean;
  hasAmplitudeKey: boolean;
  serviceName: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getProviderConfig(): ProviderConfig {
  const anamApiKey = readEnv("ANAM_API_KEY");
  const elevenLabsApiKey = readEnv("ELEVENLABS_API_KEY");

  if (!anamApiKey || !elevenLabsApiKey) {
    const missing = [
      !anamApiKey ? "ANAM_API_KEY" : null,
      !elevenLabsApiKey ? "ELEVENLABS_API_KEY" : null,
    ].filter(Boolean);

    throw new Error(`Missing provider environment: ${missing.join(", ")}`);
  }

  return {
    anamApiKey,
    elevenLabsApiKey,
    defaultAvatarId: readEnv("ANAM_AVATAR_ID"),
    defaultAgentId: readEnv("ELEVENLABS_AGENT_ID"),
  };
}

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
  return {
    hasAnamApiKey: Boolean(readEnv("ANAM_API_KEY")),
    hasElevenLabsApiKey: Boolean(readEnv("ELEVENLABS_API_KEY")),
    hasDefaultAvatarId: Boolean(readEnv("ANAM_AVATAR_ID")),
    hasDefaultAgentId: Boolean(readEnv("ELEVENLABS_AGENT_ID")),
    hasSentryDsn: Boolean(readEnv("SENTRY_DSN")),
    hasPostHogKey: Boolean(readEnv("POSTHOG_API_KEY")),
    hasAmplitudeKey: Boolean(readEnv("AMPLITUDE_API_KEY")),
    serviceName: readEnv("OTEL_SERVICE_NAME") ?? "avatar-agent",
  };
}
