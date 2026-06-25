import { NextResponse } from "next/server";
import { createAvatarSession } from "../../lib/provider-session";
import { recordServerEvent } from "../../lib/server-telemetry";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = performance.now();

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const session = await createAvatarSession(body);

    await recordServerEvent("avatar.session_token.created", {
      durationMs: Math.round(performance.now() - startedAt),
      hasElevenLabsRequestId: Boolean(session.providerTrace.elevenLabsRequestId),
      hasElevenLabsTraceId: Boolean(session.providerTrace.elevenLabsTraceId),
      hasAnamRequestId: Boolean(session.providerTrace.anamRequestId),
    });

    return NextResponse.json(
      {
        sessionToken: session.sessionToken,
        avatarId: session.avatarId,
        agentId: session.agentId,
        providerTrace: session.providerTrace,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create avatar session";

    await recordServerEvent("avatar.session_token.failed", {
      durationMs: Math.round(performance.now() - startedAt),
      error: message,
    });

    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
