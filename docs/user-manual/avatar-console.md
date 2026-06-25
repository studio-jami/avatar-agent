# Avatar Console User Manual

Date: 2026-06-25
Status: Active

The avatar console is the first working surface for running a live Avatar Agent session.

## Start A Session

1. Open the app.
2. Confirm the provider readiness chips show the expected Anam and ElevenLabs configuration.
3. Keep the default avatar and agent IDs, or enter another configured ID pair.
4. Select Start Session.
5. Allow microphone access when the browser asks.
6. Watch the status, transcript, and provider trace panels during the session.

## Stop A Session

1. Select Stop Session.
2. Wait for the status to return to idle.
3. Start again only after the previous stream closes.

## Readiness States

- Anam missing: the server cannot mint an Anam session token yet.
- ElevenLabs missing: the server cannot request a Conversational AI signed URL.
- Analytics configured: lifecycle events can forward through the telemetry endpoint.
- Provider trace present: the server received request or trace IDs from provider calls.

## Troubleshooting

- If the session fails immediately, check the error panel first.
- If microphone access is denied, allow the browser permission and restart the session.
- If the avatar video stays blank, stop the session and start again after confirming provider readiness.
- If the provider reports a credit or plan error, resolve it in the owning account dashboard before retrying.
