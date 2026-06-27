# Avatar Console User Manual

Date: 2026-06-25
Status: Active

The avatar console is the first working surface for running a live Avatar Agent session.

It now supports two provider modes:

- `Anam live session` for realtime conversational sessions.
- `Boson Higgs preview` for generated comparison clips from `assets/avatars/live`.

## Start A Session

1. Open the app.
2. Choose `Anam live session`.
3. Choose a persona.
4. Select Start.
5. Allow microphone access when the browser asks.
6. Watch the conversation panel during the session.

## Generate A Boson Comparison Clip

1. Open the app.
2. Choose `Boson Higgs preview`.
3. Choose a live avatar asset.
4. Enter a prompt for the voice text.
5. Select Generate.
6. Wait for completion and review the rendered clip in the stage.

## Stop A Session

1. Select Stop.
2. Wait for the status to return to ready.
3. Start or Generate again after the previous run is cleared.

## Troubleshooting

- If the session fails immediately, check the error panel first.
- If microphone access is denied, allow the browser permission and restart the session.
- If the avatar video stays blank, stop the session and start again after confirming provider readiness.
- If the provider reports a credit or plan error, resolve it in the owning account dashboard before retrying.
- If Boson generation stalls, clear and generate again with a shorter prompt.
