import { NextResponse } from "next/server";
import { getPublicRuntimeConfig } from "../../lib/server-env";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getPublicRuntimeConfig(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
