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
  hasOtelExporter: boolean;
  serviceName: string;
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

export function getProviderConfig(): ProviderConfig {
  const anamApiKey = readEnv("ANAM_API_KEY");
  const elevenLabsApiKey = readFirstEnv(["ELEVENLABS_API_KEY", "ELEVEN_LABS_API_KEY"]);

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
    hasPostHogKey: Boolean(readFirstEnv(["POSTHOG_API_KEY", "POSTHOG_KEY"])),
    hasAmplitudeKey: Boolean(readEnv("AMPLITUDE_API_KEY")),
    hasOtelExporter: Boolean(readEnv("OTEL_EXPORTER_OTLP_ENDPOINT")),
    serviceName: readEnv("OTEL_SERVICE_NAME") ?? "avatar-agent",
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
