import { getTelemetryConfig } from "./server-env";

type TelemetryAttributes = Record<string, string | number | boolean | undefined>;

const SENSITIVE_ATTRIBUTE_PATTERN = /(api.?key|token|secret|password|signed.?url|authorization)/i;

function cleanAttributes(attributes: TelemetryAttributes): TelemetryAttributes {
  return Object.fromEntries(
    Object.entries(attributes).filter(([key, value]) => value !== undefined && !SENSITIVE_ATTRIBUTE_PATTERN.test(key)),
  );
}

function getDistinctId(attributes: TelemetryAttributes): string {
  return typeof attributes.userId === "string" && attributes.userId.trim() ? attributes.userId.trim() : "avatar-agent-server";
}

async function sendPostHogEvent(name: string, attributes: TelemetryAttributes) {
  const config = getTelemetryConfig();
  if (!config.postHogApiKey || !config.postHogHost) {
    return;
  }

  const endpoint = new URL("/capture/", config.postHogHost);
  await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: config.postHogApiKey,
      event: name,
      distinct_id: getDistinctId(attributes),
      properties: {
        ...attributes,
        service: config.serviceName,
      },
    }),
    cache: "no-store",
  });
}

async function sendAmplitudeEvent(name: string, attributes: TelemetryAttributes) {
  const config = getTelemetryConfig();
  if (!config.amplitudeApiKey) {
    return;
  }

  await fetch("https://api2.amplitude.com/2/httpapi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: config.amplitudeApiKey,
      events: [
        {
          event_type: name,
          user_id: getDistinctId(attributes),
          event_properties: {
            ...attributes,
            service: config.serviceName,
          },
          time: Date.now(),
        },
      ],
    }),
    cache: "no-store",
  });
}

export async function recordServerEvent(name: string, attributes: TelemetryAttributes = {}) {
  const config = getTelemetryConfig();
  const clean = cleanAttributes(attributes);
  const payload = {
    service: config.serviceName,
    name,
    attributes: clean,
    at: new Date().toISOString(),
  };

  if (process.env.NODE_ENV !== "test") {
    console.info("[avatar-agent.telemetry]", JSON.stringify(payload));
  }

  const results = await Promise.allSettled([sendPostHogEvent(name, clean), sendAmplitudeEvent(name, clean)]);
  for (const result of results) {
    if (result.status === "rejected" && process.env.NODE_ENV !== "test") {
      console.warn("[avatar-agent.telemetry.forwarding_failed]", result.reason instanceof Error ? result.reason.message : result.reason);
    }
  }
}
