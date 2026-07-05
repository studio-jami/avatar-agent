# Anam and Boson runtime fixes

Date: 2026-06-26
Type: fix

- Fixed Anam session-token persona configuration handling so client engine session start no longer fails with validation 400 for persona-bound sessions.
- Added backward-compatible fallback when legacy persona values are stored under avatar-style env keys.
- Updated Boson live avatar asset discovery to include deploy-safe `apps/web/public/avatars/live` so provider availability can be detected in production.
- Added curated live avatar assets under `apps/web/public/avatars/live` for Boson preview generation and selector population.
