---
doc: prd
status: draft
---
<!-- Drafted with the Devpost Learn `3-prd` skill. The learner reviews this file and
     flips `status` to `approved` when it reads right. -->

# GapMap — Product Requirements

A one-page web app for students and fresh graduates applying to junior tech roles: it maps every requirement in a job post to the CV line that proves it, on-device.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
1. **Arrive.** The user opens the page. They see the headline question ("Does your CV *prove* what the job asks for?"), a one-paragraph explanation, a privacy line ("Nothing is uploaded"), two empty text boxes and three buttons: **Map the gaps**, **Try a sample**, **Clear**. A chip in the top bar says the AI model is not loaded yet.
2. **Fill in.** They paste a job post and their CV (or click **Try a sample** to load a clearly-labelled fictional pair). Word counts update live. Focusing either box starts loading the model in the background; the chip shows a percentage, then "AI model ready · runs offline in your browser".
3. **Map.** They press **Map the gaps**. The status line says what is happening ("Reading 13 requirements and 18 CV lines…"), then "Mapped 13 requirements in 2.6 s — on this device." The page scrolls to the results.
4. **Read the map.** A summary card shows the fit score in a ring, a one-line verdict, counts of proven / partial / gaps (which double as filters), and "Words the post uses that your CV never does" as chips. Below, every requirement is a row: status pill, requirement text, must-have / nice-to-have, and on the right the best proof quoted from the CV with its match %. Must-haves come first, gaps first within them. The CV is shown alongside with the lines that prove something tinted.
5. **Inspect.** Clicking a row expands it: the three closest CV lines with their scores, and a prompt — "Looks good" for proven, "How to make it explicit" for partial, "How to close this gap" for gaps. If the row has proof, the matching CV line is highlighted and scrolled into view.
6. **Improve and re-map.** The user clicks **← Edit inputs**, adds a true bullet to their CV, and presses **Map the gaps** again. The summary shows "+N pts since your last map" and the row flips status.
7. **Take it away.** **Copy report (Markdown)** puts the whole map — statuses, evidence, next steps, missing words — on the clipboard (download as `gapmap-report.md` if clipboard is blocked).

Success = the user knows, line by line, which requirements their CV proves and what to add before applying.

## Screens and Layout
One page, top to bottom:
- **Top bar** (sticky): GapMap wordmark + model status chip.
- **Intro**: eyebrow, serif headline, lede, privacy line.
- **Inputs**: two side-by-side cards ("01 · The job post", "02 · Your CV") with word counts; action row with the three buttons and a status line.
- **Results** (hidden until first map): summary card (ring, verdict, tally filters, missing words, Copy / Edit buttons); then a two-column board — requirement rows (left, wider) and the CV view (right, sticky).
- **Footer**: model credit, licence, source link.
On narrow screens everything stacks into one column.

## Look and Feel
- Editorial, paper-like: warm off-white background with a faint dot grid, ink-black text, cards slightly lighter than the page.
- Type: **Instrument Serif** for the wordmark, headline and verdict; **Inter** for body; **IBM Plex Mono** uppercase for labels, counts and scores.
- Colour carries meaning only: green = proven, amber = partial, vermilion = gap (pill, left border, tint). The yellow highlighter marks the CV line you're looking at.
- Calm motion: the fit ring fills and the number counts up; rows rise in with a short stagger. No confetti, no gradients, no robot icons.
- Copy is direct and honest ("No line in your CV proves this.").

## Features and Behavior

### Requirement extraction
- Splits the post into lines; drops headings (short lines, lines ending in ":"), "About us", benefits/"We offer" sections and boilerplate.
- Strips bullets and numbering; splits long lines into separate claims at sentence ends and semicolons; ignores fragments under four words.
- Marks a requirement **nice to have** if it sits under a "Nice to have / Bonus / Preferred" heading or says "is a plus / preferred" inline. Nice-to-haves count half toward the fit score.
  - [ ] The sample post yields 13 requirements, none from "About us" or "We offer".
  - [ ] The three sample nice-to-haves are labelled "nice to have".

### Evidence matching (the kernel)
- Each CV line (or sentence of a long line) is an evidence candidate and remembers its line number.
- Each requirement is compared with every candidate by meaning (on-device sentence embeddings) plus a small bonus for shared key words and for exact tool/acronym hits (TypeScript, WCAG, Next.js).
- Status by best match: **proven** ≥ 52%, **partial** ≥ 42%, otherwise **gap**. The status uses the same rounded % the user sees.
- Fit score = weighted share of requirements proven (1) or partial (0.5).
  - [ ] "Build and ship React components…" is proven by the "Built 20+ reusable React components…" line in the sample.
  - [ ] "Write TypeScript…" and "Write unit tests… Jest or Vitest" are gaps in the sample.
  - [ ] Clicking a proven row highlights its CV line.

### Missing words
- Tool names, acronyms and proper nouns from unproven requirements that never appear anywhere in the CV, most important first (max 12).
  - [ ] Sample shows TypeScript, Jest, Vitest, WCAG.

### Gap prompts
- Partial: quotes the near-miss line and asks the user to name the skill explicitly and add a result — *if it's true*.
- Gap: asks whether they have done it anywhere (class, internship, side project); if not, says it's a real gap to learn or address in a cover letter. Never writes fake experience.

### Re-map with delta
- Mapping again after an edit shows "+N / −N pts since your last map" next to "Your map".
  - [ ] Adding a TypeScript + Vitest bullet to the sample CV turns both rows green and shows a positive delta.

### Saving and export
- Both boxes are saved in the browser as you type and restored on reload. **Clear** empties both and hides results.
- **Copy report (Markdown)**: fit, counts, every requirement with ✅/🟡/❌, evidence and next steps, missing words.

## States and Boundaries
- **First use** — empty boxes, model chip "not loaded yet"; **Try a sample** is the obvious way in.
- **Model loading** — chip shows %; Map button disabled while a map runs; status line explains.
- **Empty input** — "Paste a job post and your CV first — or try the sample." and focus moves to the empty box.
- **No requirements found** — "I couldn't find requirement lines. Paste the part of the post with the bullet points."
- **Model failure** — chip turns red, status says to reload. No fake results.
- **Offline** — after the first load the model is in memory/cache; mapping keeps working without a connection.
- **Privacy** — no network requests with user text, ever. All files are served from the same site.

## Product Decisions
- On-device model instead of a cloud LLM — a CV is personal data; no keys, no server, free to host.
- Show evidence and a % for every row instead of only a total score — the score is only trustworthy if you can see why.
- Prompts ask, never rewrite — the tool must not encourage inventing experience.
- English job posts only for the POC — the small model is English-trained.

## What We're Building
Everything in **The Core Journey** and **Features and Behavior** above, as a static site on GitHub Pages.

## Deferred From the POC
- PDF/DOCX upload (text paste proves the idea).
- Multiple saved job posts / history.
- Vietnamese-language posts.

## Possible Later Enhancements
- Small on-device LLM to draft a bullet *from facts the user types in*.
- Browser extension that reads the job post from the page you're on.

## Non-Goals
- Not an ATS simulator or a promise of getting past one.
- No CV rewriting, no cover-letter generation.
- No accounts or analytics.

## Open Questions
- Thresholds (52% / 42%) are tuned on the sample and a few real posts; may need adjusting per field (can wait until after the POC).
