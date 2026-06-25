# Development

Date: 2026-06-25
Status: Active

## Commands

Run commands from the repo root.

- `pnpm install` - install workspace dependencies.
- `pnpm dev` - start the Avatar Agent web app on port 3638.
- `pnpm typecheck` - run TypeScript validation for the web app.
- `pnpm build` - build the web app.
- `pnpm verify` - run typecheck and build.

## Runtime Surface

The accepted working surface lives in `apps/web/`.

- `app/api/anam-session/route.ts` mints ElevenLabs signed URLs and Anam session tokens server-side.
- `app/api/runtime/route.ts` exposes non-secret readiness flags to the client.
- `app/api/telemetry/route.ts` receives safe client lifecycle events and records them through the server telemetry seam.
- `app/ui/avatar-console.tsx` owns the avatar video element, start/stop controls, transcript stream, provider trace display, and live error states.

## Local Run

1. Copy `.env.example` to `.env`.
2. Fill `ANAM_API_KEY`, `ANAM_AVATAR_ID`, `ELEVENLABS_API_KEY`, and `ELEVENLABS_AGENT_ID`.
3. Run `pnpm install`.
4. Run `pnpm dev` and open `http://localhost:3638`.

Provider keys stay server-side. The client receives only the short-lived Anam session token and non-secret provider trace metadata.
