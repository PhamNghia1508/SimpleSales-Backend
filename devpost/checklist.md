---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Paste a post and a CV and see every requirement mapped to its best CV line**
  Becomes usable: Page with two boxes; Map the gaps splits both texts, runs the on-device model and lists requirements with proven / partial / gap and the best evidence line.
  Why now: This is the kernel and the riskiest part (does an in-browser model load from local files and give sensible scores?). Scaffold, vendored runtime and model are part of this slice.
  PRD ref: `prd.md > The Core Journey` (steps 1–4), `prd.md > Requirement extraction`, `prd.md > Evidence matching (the kernel)`
  Spec ref: `spec.md > Requirement & evidence splitter`, `spec.md > Embedding model`, `spec.md > Scorer`, `spec.md > File Structure`
  Build: index.html + style.css skeleton, vendor Transformers.js + ONNX wasm + MiniLM weights, engine.js split/score, model.js, app.js run + render rows.
  Verify (mechanical): Serve locally, headless Chromium loads the sample, clicks Map, results appear with no console errors; Node calibration script prints sensible statuses for the 13 sample requirements.
  Learner check: Click Try a sample → Map the gaps; do the green/amber/red rows match what you'd judge by eye?
  Commit: `Map requirements to CV evidence with on-device embeddings`

- [x] **2. Understand and act on each result**
  Becomes usable: Fit ring + verdict + tally filters + missing-words chips; clicking a row shows top-3 lines and an honest prompt and highlights the CV line.
  Why now: The map is only useful if the user can see *why* and *what to do*.
  PRD ref: `prd.md > The Core Journey` (steps 4–5), `prd.md > Missing words`, `prd.md > Gap prompts`
  Spec ref: `spec.md > Scorer`, `spec.md > UI controller`
  Build: summary card, filters, CV view with line tints, row expand + highlight, proofPrompt().
  Verify (mechanical): Screenshot after clicking a partial row shows the detail panel and the highlighted CV line 21.
  Learner check: Click a gap, a partial and a proven row — is the prompt helpful and honest?
  Commit: `Add summary, filters, evidence highlight and gap prompts`

- [x] **3. Improve, re-map, keep it**
  Becomes usable: Inputs persist; re-mapping shows "+N pts since your last map"; Copy report (Markdown); empty/error states; works offline after first load.
  Why now: Closes the core loop (edit → re-map) and makes the result portable.
  PRD ref: `prd.md > Re-map with delta`, `prd.md > Saving and export`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Data Model`, `spec.md > UI controller`
  Build: localStorage, delta chip, toMarkdown + clipboard/download, validation messages, offline check.
  Verify (mechanical): Recorded run: adding TypeScript + Vitest bullets moves the sample from 70% to 85% (+15) in the browser, with the unit-test row flipping to proven; re-map with the browser set offline still succeeds; `npm test` passes.
  Learner check: Add a true bullet to your own CV and map again — does the delta and the flipped row feel right?
  Commit: `Add re-map delta, persistence, Markdown report and states`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 1 (sample run reviewed via screenshots; thresholds adjusted, see Revisions)
- [ ] Final kick-the-tires exploration and feedback completed — learner to try it with a real job post and their own CV

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: app map generated; learner walkthrough pending.
Route and stops: `js/app.js > run()` → `js/engine.js > scoreMatches()` → `js/app.js > buildRow()`.
Edit outcome: not yet offered.
Reflection: not yet offered.
Activity mode: reference-only route until the learner does the walkthrough.

## Revisions

- "About us" text was being read as a requirement — added skip-sections (about us, benefits, we offer, how to apply) to the splitter.
- Missing-words list was full of ordinary verbs — switched to "distinctive" terms only (tools, acronyms, proper nouns, things like Next.js / C#).
- A requirement could show "52%" yet be labelled partial — statuses now use the same rounded % the user sees; thresholds set to 52% / 42% after running the sample.
- Exact tool-name hits get a small fixed bonus (+0.08) so "built with Next.js" counts for "Experience with Next.js", without letting a bare skills list decide everything.
