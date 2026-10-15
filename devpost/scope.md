---
doc: scope
status: draft
---
<!-- Drafted with the Devpost Learn `2-scope` skill. The learner reviews this file and
     flips `status` to `approved` when it reads right. -->

# GapMap

Paste a job post and your CV; GapMap links every requirement to the CV line that proves it — or marks it as a gap — using an AI model that runs entirely in the browser.

## The Unique Kernel
**Requirement-by-requirement evidence, not a keyword score.** Every line of the job post is paired with the exact CV line that proves it (with a match percentage you can inspect), so "you're a 67% match" always comes with *why* and *what to fix*. And because the model runs on-device, a CV — one of the most personal documents people own — never gets uploaded anywhere.

## Who It's For
A student or fresh graduate in Vietnam applying to junior developer / designer roles and internships, often in English, sending 10–30 applications a month. Today they either send the same CV everywhere, or paste their CV into a chatbot and get back a generic rewrite they can't verify — and they've just handed a third party their phone number, address and work history.

## The Core Loop
1. Paste the job post and the CV (or keep the CV saved from last time).
2. Press **Map the gaps** → see the fit score and every requirement colour-coded *proven / partial / gap*, each with its best evidence line.
3. Click a gap or partial → see the closest CV lines and an honest "how to close this" prompt.
4. Edit the CV (add the missing bullet if it's true), map again → watch the gap turn green and the score move.

They come back for every new job post: the CV stays saved, only the post changes.

## Inspiration & Identity
- Feels like a careful editor's markup on paper, not a glowing "AI dashboard": warm paper background, ink-black type, serif headline, mono labels.
- Three signal colours with fixed meaning: green = proven, amber = partial, vermilion = gap.
- Tone: direct and honest. It never invents experience; it asks "have you done this?".
- References: diff/review tools (line-by-line, clickable), ATS "match score" tools (what we want to improve on).

## Why This Matters to the Learner
Built by a fresh Software Engineering graduate who is applying for roles and freelance work right now, and who wants a tool he would actually trust with his own CV. Also a chance to practise shipping real AI that needs no server or API key.

## What "Working" Looks Like
Open the page (no login), click **Try a sample**, press **Map the gaps**: within a few seconds a fit score appears and each requirement shows *proven / partial / gap* with the CV line that proves it; clicking a requirement highlights that line in the CV. The "oh, that's cool" beat: add one true bullet to the CV, map again, and the gap flips to green with "+N pts since your last map" — all while the browser is offline.

## The POC Boundary
- One page, two text boxes (job post, CV) as plain text.
- Requirement extraction from the post (bullets, sentences, must-have vs nice-to-have).
- On-device embeddings (small sentence-embedding model) + keyword overlap → per-requirement status, top-3 evidence, fit score, missing words.
- Click-to-highlight evidence in the CV; filters; re-map with score delta.
- Inputs saved in the browser (localStorage); copy the report as Markdown.

## Later
- PDF / DOCX CV upload.
- Saving several job posts and comparing them side by side.
- Vietnamese-language job posts (needs a multilingual model).
- Optional larger on-device LLM to suggest rewritten bullets (only from facts the user confirms).

## Explicitly Cut
- **Accounts, server, database** — the whole point is that the CV stays on the device.
- **Cloud LLM APIs** — would mean uploading the CV and needing API keys; also out of the 2–4 hour budget.
- **Auto-rewriting the CV** — risks inventing experience; GapMap only points at gaps and asks.
- **Scraping job sites** — terms-of-service risk and brittle; pasting text is enough to prove the idea.
