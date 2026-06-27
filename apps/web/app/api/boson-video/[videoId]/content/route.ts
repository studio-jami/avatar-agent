import { NextResponse } from "next/server";
import { getBosonVideoContent } from "../../../../lib/boson-video";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: { videoId: string } }) {
  try {
    const { videoId } = context.params;
    const response = await getBosonVideoContent(videoId);

    return new Response(response.body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": response.headers.get("content-type") ?? "video/mp4",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to stream Boson video";
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
