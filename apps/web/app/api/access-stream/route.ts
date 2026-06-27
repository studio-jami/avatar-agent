import { NextResponse } from "next/server";
import { hasAccessStreamTool, runAccessStreamTool } from "../../lib/access-stream";
import { recordServerEvent } from "../../lib/server-telemetry";

export const dynamic = "force-dynamic";

type AccessStreamRequest = {
  tool?: unknown;
  parameters?: unknown;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const startedAt = performance.now();

  let body: AccessStreamRequest;
  try {
    body = (await request.json()) as AccessStreamRequest;
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const tool = typeof body.tool === "string" ? body.tool.trim() : "";
  if (!tool) {
    return jsonError("A 'tool' name is required.", 400);
  }

  if (!hasAccessStreamTool(tool)) {
    await recordServerEvent("avatar.access_stream.rejected", { tool });
    return jsonError(`Unknown access stream tool: ${tool}`, 404);
  }

  const parameters =
    body.parameters && typeof body.parameters === "object" && !Array.isArray(body.parameters)
      ? (body.parameters as Record<string, unknown>)
      : {};

  try {
    const result = await runAccessStreamTool(tool, parameters);
    await recordServerEvent("avatar.access_stream.invoked", {
      tool,
      ok: true,
      durationMs: Math.round(performance.now() - startedAt),
    });
    return NextResponse.json({ result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Access stream tool failed.";
    await recordServerEvent("avatar.access_stream.invoked", {
      tool,
      ok: false,
      durationMs: Math.round(performance.now() - startedAt),
      error: message,
    });
    return jsonError(message, 500);
  }
}
