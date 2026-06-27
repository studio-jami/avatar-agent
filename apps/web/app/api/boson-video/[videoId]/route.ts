import { NextResponse } from "next/server";
import { getBosonVideo } from "../../../lib/boson-video";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: { videoId: string } }) {
  try {
    const { videoId } = context.params;
    const video = await getBosonVideo(videoId);

    return NextResponse.json(
      {
        videoId: video.id,
        status: video.status,
        progress: video.progress,
        error: video.error,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read Boson video status";
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
