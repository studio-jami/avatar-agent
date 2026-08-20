# Agent Buildout

> This is a working brainstorm, refined as decisions land. Locked decisions and official
> source links now live in
> [`../decisions/voice-avatar-layer-architecture.md`](../decisions/voice-avatar-layer-architecture.md)
> and the provider findings in
> [`../research/elevenagents-tools-and-luna-bridge.md`](../research/elevenagents-tools-and-luna-bridge.md).
> This file stays the shape-in-progress sketch, not the source of truth for boundaries.

Chat is the main input for the chat panels and agent comms
Luna is a seperate voice/video layer that will have specific parallel access

local store would be our stream/queueue seperation layer between chat/voice and how it comes and goes through

Gateway -

intent router is effectively what were buildign in 'luna' from Eve code.
chat input, and/or lunas passthru input will be handled by eves framework to route the work through the intended flow
routing to models and then they have access to the tools.extensions.db, etc as needed..

then we have our channels for where it comes in..interacted with etc.

chat is a direct connection to local store <> gateway. its mainly chat or api calls. surfaced as the main chat panel in the working UI
voice will be a standalone widget. something that lets me work completely independent of the UI and rthe tyoical chat flow.
clear seperation between them.

most likely it will live as a simple orb with status indication in the current UI with a companion app for the avatar and voice layer
we would likely make available the transcript, streaming of course, as a toggled view in the chat panel. clean simplpe toggle icon in header for
viewing and typing to the voice agent.

the standalone will be a simple video feed and voice widget without typing. on alwasy on wake word super responsive and effective voice layer i can just say
'hey luna -start up [literally anything]' and bc well have the right tools hooked to Luna, shell kick up our eve framework, full ui and api flows
and start sending my requests to the local store<>gateway intent router, all the while luna keeps chatting -only passiing through the work as needed.

We'll use elevenlabs agent here. effective. ncie and clean.

luna is a parallel layer that can optionally route work through the gateway,
has real-time connection to the local store for updates and insights without breaking conversational flow

overlays
draggable
resizable

voice can be always on
system tray
open to voice orb
or video feed
or both

streaming transcript optional
history
configurations
model selection
account selection

## Accounts

Jami Studio
Elevenlabs
Anam
deepgram
vivix

Yrka
Elevenlabs
Anam

Jamienavinhill
Anam

## HotKeys

Toggle Wakeword
alt+w

Toggle Voice Widget
alt+c

Toggle avatar Widget
alt+a

Toggle Live Session
alt+z

Toggle Mute
alt+m

Toggle Panel
alt+q

Move Panel
alt+q+tab

Change Panel details
alt+d
