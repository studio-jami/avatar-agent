import { NextResponse } from "next/server";
import { createElevenLabsConversationToken } from "../../lib/elevenlabs-session";
import { recordServerEvent } from "../../lib/server-telemetry";

export const dynamic = "force-dynamic";

export async function POST() {
  const startedAt = performance.now();

  try {
    const session = await createElevenLabsConversationToken();

    await recordServerEvent("avatar.elevenlabs_token.created", {
      durationMs: Math.round(performance.now() - startedAt),
      hasElevenLabsRequestId: Boolean(session.providerTrace.elevenLabsRequestId),
      hasElevenLabsTraceId: Boolean(session.providerTrace.elevenLabsTraceId),
    });

    return NextResponse.json(
      {
        conversationToken: session.conversationToken,
        agent: session.agent,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create ElevenLabs conversation token";

    await recordServerEvent("avatar.elevenlabs_token.failed", {
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
