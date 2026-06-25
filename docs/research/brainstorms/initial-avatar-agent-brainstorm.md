\# Live real-time Avatar w/ BROAD ACCOUNT ACCESS \& FULL SYSTEM CAPABILITIES (BRAINSTORM)



For internal development first > Production product once refined = ALWAYS MODULAR AND ADAPTABLE

UTILIZE the previous investigations and reports from "C:\\Users\\james\\orgs\\oss\\\_ops\\planning\\research\\masters"

UTILIZE the accepted and ACTIVE partner programs - GT confirmation from user before assuming active credits.



* Connected to ALL Jami.Studio accounts - Access to my local system - Becomes my interaction layer for working with llms. Can spawn agents, use CLI, File tools, web search, etc., etc.



* Should consider the optimal way to serve inference at each layer. top level async agent who can run tools and agents in the bg while we continue the contextual conversation with the avatar.
* alleviate the load so the heavy work is routed to subagents - but needs to be under LuLus context and control.



order of llm usage for inference: elevenlabs grant/ anam trial / google pro sub / Cloudflare credits with pnam / (yrka.io) vertex genai trial credits / any other partner credits / GitHub + copilot credit pool (only for coding tasks atm.)



https://anam.ai/cookbook/elevenlabs-server-side-agents

https://github.com/anam-org/anam-cookbook/blob/main/content/recipes/elevenlabs-server-side-agents.mdx

https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-computer-use-gemini-3-5-flash/

https://anam.ai/docs/python-sdk/overview

https://anam.ai/docs/embed/overview

https://github.com/anam-org



This will be for our internal testing and development for the eventual in-app avatar. this one will NOT include any heavy or burdensome security, governance, etc. this is about dialing in the workflow, UX, and the quality of the interactions.



Deployed to a subdomain of jami.studio or a /\* url on jami.studio for OUR own use in development, not for public consumption

avatar.jami.studio or jami.studio/avatar - which makes most sense and aligns with the current organizational hierarchy?



auth protected route? - FULL IP access for us? - simple, easy for now. this does NOT need to be the same final production url, or setup, this is for me to stand up the embed and have a home surface to congruently build out the sdk alongside.



?? What system to use for auth - Partner Provider credits where available. Merge? Our own system? ElevenLabs Agent platform? standard MCP protocols? most aligned with ease of use + reuse with the planned adapter seams in our products.



Accounts (MOSTLY ALL are already in .env's that are scattered around the repos)



Google suite: drive, calendar, gmail, sheets, etc.

GitHub, Vercel, Cloudflare, GCS, AWS, etc.

ElevenLabs, Anam, etc.

Supabase, Neon, Mongo, etc.

lightfield, notion, linear, slack, etc.

sentry, posthog, amplitude, etc.

framer, miro, maker, solo, etc.

sendpulse, replit, etc.

socials, console accounts, etc.

anything im missing, all partner platforms, hosting provers and everything in betweem



Where does this access layer belong - which agent or which part of our system shoul be the one to utiliz the actual connection or tool. who is providing that llm service - does the avatar agent even need to do these or do we separate that entirely from that provider - host - and provide the 'data' or details into the context.



For example:

I ask the avatar " whats on my schedule for today" it doesnt need to check and pull a bunch of courses becasue we already (should) have that system set up on its own, with our various accounts being funneled into one central planning app. for now we lik the lighthouse app, feels solid to use and doea good job of centralizign and makign that available to agents thru mcp or api..



same with accounts - no reason the avatar is anyting other than a visual layer on top

all the tool calling and realwork happens behind the scnenes, utilizes our apps and systems and surfaces the results or data to the avatars context or the chat surface as needed



so the easssiest fastest way then is to give (both the embed and SDK i think) a clear and clean connection to an 'access' stream with the ability to call tools, spawn agents, and respond to the requests based on what its seeing in the access stream.





\---



Things to consider:



* Separation of concerns for adaptability and avoiding vendor lock-in
* Highest Quality - Lowest Cost - Avatar Inference
* Develop focused on the interaction layer between the \[>>> user <> avatar agent <> access + tools + subagents <<<]
* Can we develop this so that it serves us both internally and eventual easy plugin/port into the product layers (both jami.studio and yrka.io)
* Not to assume or HARDCODE us into corners or constraints
* Is there any open-weight avatar video model we could host on an active partner credit pool instead of routing through the cloud provider
* DO NOT reinvent the wheel. UTILIZE THE OFFICIAL GUIDANCE where relevant. DO NOT add constraints or retard the development with trivial self-blocking bullshit like semantic trivial testing and heavy over engineered abstractions.

  * Elevenlabs 3million credits for voice, 1 million for media creation (including lipsync videos.. not real-time avatar per say.. but could potentially support us in some ways? :  marketing and demo videos of the talking avatar with our voices and custom scripts. bulk animated talking clips to resync to our own tts engine that doesn't need a real-time avatar model at all? unlikely but a pipedream. similar to how i believe Xai set up the Grok characters.. with prerecorded animations of talking and just synced to the state.. interesting concept for sure.



Top Goals:

Embedded player I can use now (and use for internal projects outside of the orgs/ lanes - start solid and include all the obvious targets and abilities that come native or are easy to hook up - ill add the more complicated functions in time to the embed where possible



SDK development path: this will be a two-track dev cycle.



first track is internal - high velocity - and does not need to include any of the burdensome security or provisioning that the production product will require. this will allow us to hook our elevenlabs + anam agent into a real working useful FULL access workflow - that does NOT CARE ONE bit about security outside of the normal local dev standards.



the second track is then the our work in trying or testing various providers and tools in this stack, to see where it makes sense and the most optimal setup and system for us. This will look like a merging between oss/ work and the agent-avatar. we will keep this repo open source and public. Do not commit staging assets. we will only commit a curated set of media for users.



utilizing elevenlabs grant credits. the small amount of anam time left (we may do the $30/mo for 7months promo we have i this goes well, so far we really like anams dx.. been very easy to create a talking avatar that looks great, sounds great, and even is nicely integrated with our preferred tts provider in 11labs.. plsu the 11labs 3 million voice and 1million video credits are also  sweet.



We will here test out the supporting approaches for the various concerns in the stack, always separting them logically - even if bundled and handled by the same provider (for now) should be composted and adaptable to single responsibilities instead of lumping together. within reason.. might need some flex here.. but it is the GOAL.



\---





Follow + BRING over the standards established in "C:\\Users\\james\\orgs\\oss\\\_ops\\planning\\standards"



Set up the repo with rules, docs, dotfiles, and proper folder hierarchy using the existing repos as examples altered as needed for this project. no unnecessary roto files, all should live in properly organized homes 



set up the changelog system. hook up any monitoring an observanbility tools (we have over 100k to monitoring and observability platforms. Utilize the existing set up as we have it, but for this repo) 



move this readme into a brainstorm doc saved to this repos research docs and create a proper readme



this repo will be public



review and audit the existing research and reports. review and audit the latest advancements and opportuntiies as of June 25 2026

compile a feasibility report 



Simple is better than complex

Always upstream - never create churn or required maintenance

DO NOT add self-blocking, self-gating, or restrictive abstractions or requirements that slows down development









INIT and SYNC to the new repo: https://github.com/studio-jami/avatar-agent.git

