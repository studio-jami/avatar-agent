type TelemetryAttributes = Record<string, string | number | boolean | undefined>;

function cleanAttributes(attributes: TelemetryAttributes): TelemetryAttributes {
  return Object.fromEntries(Object.entries(attributes).filter(([, value]) => value !== undefined));
}

export function recordServerEvent(name: string, attributes: TelemetryAttributes = {}) {
  const payload = {
    service: process.env.OTEL_SERVICE_NAME || "avatar-agent",
    name,
    attributes: cleanAttributes(attributes),
    at: new Date().toISOString(),
  };

  if (process.env.NODE_ENV !== "test") {
    console.info("[avatar-agent.telemetry]", JSON.stringify(payload));
  }
}
