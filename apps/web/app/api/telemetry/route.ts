import { NextResponse } from "next/server";
import { recordServerEvent } from "../../lib/server-telemetry";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { name?: unknown; attributes?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.slice(0, 120) : "avatar.client.event";
  const attributes = body?.attributes && typeof body.attributes === "object" && !Array.isArray(body.attributes)
    ? Object.fromEntries(
        Object.entries(body.attributes).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)),
      )
    : {};

  await recordServerEvent(name, attributes);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
