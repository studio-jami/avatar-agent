import { NextResponse } from "next/server";
import { createBosonVideo } from "../../lib/boson-video";
import { recordServerEvent } from "../../lib/server-telemetry";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = performance.now();

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const video = await createBosonVideo(body);

    await recordServerEvent("avatar.boson.video.created", {
      durationMs: Math.round(performance.now() - startedAt),
      status: video.status,
    });

    return NextResponse.json(
      {
        videoId: video.id,
        status: video.status,
        progress: video.progress,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Boson video";

    await recordServerEvent("avatar.boson.video.failed", {
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
