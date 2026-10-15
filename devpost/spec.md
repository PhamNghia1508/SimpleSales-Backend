---
doc: spec
status: draft
---
<!-- Drafted with the Devpost Learn `4-spec` skill. The learner reviews this file and
     flips `status` to `approved` when it reads right. -->

# GapMap — Technical Spec

## How This Works, In Plain Language
GapMap is a single web page — plain HTML, CSS and JavaScript files, no server code. When you press **Map the gaps**:
1. **The splitter** cuts the job post into individual requirements and the CV into individual evidence lines (it remembers which CV line each piece came from).
2. **The model** — a small AI model called *all-MiniLM-L6-v2* (about 23 MB) — turns every sentence into a list of 384 numbers that describes its *meaning*. Sentences that mean similar things get similar numbers, even with different words ("Converted Figma mockups into pages" ≈ "Turn Figma designs into interfaces"). The model runs inside the browser using WebAssembly, through the open-source Transformers.js library.
3. **The scorer** compares every requirement with every CV line (cosine similarity), adds a small bonus when the exact same tool names appear, and picks the best match. Above 52% = proven, above 42% = partial, else gap. The fit score is the weighted share of proven/partial requirements.
4. **The page** draws the summary, the requirement rows and the CV with highlights.

Why this shape: a CV is private, so nothing is sent anywhere — the model files are shipped with the site itself. No server also means it can be hosted free on GitHub Pages and anyone can try it without an account or an API key.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.
1. Page loads → `js/app.js` restores saved inputs from `localStorage`.
2. User focuses a box or clicks **Try a sample** → `warmModel()` calls `js/model.js > loadModel()`, which downloads `/models/...onnx` and the ONNX Runtime `.wasm` from the same site; progress updates the chip.
3. **Map the gaps** → `engine.splitRequirements(job)` and `engine.splitEvidence(cv)` → `model.embed([...requirements, ...evidence])` → normalised vectors.
4. `engine.scoreMatches()` → rows (status, score, top-3 evidence), fit, counts, missing words.
5. `app.render()` → summary ring, tally filters, chips, rows (from `<template id="rowTpl">`), CV view with line tints. Clicking a row → highlight the CV line by `data-line`.
6. Edit + map again → same path; `render()` receives the previous fit and shows the delta.
7. **Copy report** → `engine.toMarkdown()` → clipboard (or `.md` download fallback).

## Stack
- **Vanilla HTML/CSS/JavaScript (ES modules)** — no build step; files are served as-is. Keeps the POC small and deployable anywhere.
- **Transformers.js 3.8.1** (`@huggingface/transformers`, Apache-2.0) — runs the model in the browser. Docs: https://huggingface.co/docs/transformers.js
- **ONNX Runtime Web** (bundled with Transformers.js, WebAssembly backend). Docs: https://onnxruntime.ai/docs/tutorials/web/
- **Model: Xenova/all-MiniLM-L6-v2**, 8-bit quantised ONNX (Apache-2.0). Card: https://huggingface.co/Xenova/all-MiniLM-L6-v2 (port of sentence-transformers/all-MiniLM-L6-v2).
- **Fonts**: Instrument Serif, Inter, IBM Plex Mono (SIL Open Font License), self-hosted.
- **Tests**: Node's built-in `node:test` (Node 18+), no dependencies.

## Where It Runs and How Someone Tries It
- Runtime: any modern desktop or mobile browser with WebAssembly (Chrome, Edge, Firefox, Safari). No API keys.
- Local: `python3 -m http.server 8000` in the repo folder (or `npm start`), open http://localhost:8000. Opening `index.html` from the file system will not work because browsers block ES-module/wasm loading from `file://`.
- Live: GitHub Pages from the `main` branch root → https://phamnghia1508.github.io/gapmap/
- Tests: `npm test` (or `node --test tests/*.test.mjs`).
- Demo recording: click **Try a sample** → **Map the gaps** → open a gap, a partial and a proven row → add a TypeScript and a Vitest bullet to the CV → map again → copy report.

## Look and Feel
From `prd.md > Look and Feel`: CSS custom properties in `css/style.css` — `--paper #f3efe6`, `--card #fbf9f4`, `--ink #16181d`, `--proven #1f7a4d`, `--partial #b07800`, `--gap #c9402a`. Serif display (`--serif`), sans body (`--sans`), mono labels (`--mono`). Dot-grid page background, 12–18px radii, 1px warm rules, left status border on rows. Motion limited to ring fill, count-up and row rise.

## Components

### Requirement & evidence splitter (`js/engine.js`)
`splitRequirements()`, `splitEvidence()`, `cleanLine()`. Heading/boilerplate/section detection by regex; nice-to-have detection by section heading or inline phrase.
PRD ref: `prd.md > Requirement extraction`.

### Embedding model (`js/model.js`)
Configures Transformers.js for local-only files (`allowRemoteModels = false`, `localModelPath = ./models/`, `wasmPaths = ./vendor/`, `numThreads = 1`), loads the `feature-extraction` pipeline once with progress reporting, and embeds texts in batches of 16 with mean pooling + L2 normalisation.
PRD ref: `prd.md > Evidence matching (the kernel)`, `prd.md > States and Boundaries` (model loading / failure / offline).

### Scorer (`js/engine.js`)
`scoreMatches()`: score = cosine + 0.12 × keyword overlap + 0.08 if any tool/acronym matches (capped at 1). `statusFor()` on the rounded %. Fit = Σ weight × credit / Σ weight. Missing words = `distinctiveTerms()` of unproven requirements not found in the CV. `proofPrompt()` and `toMarkdown()` produce the honest next-step text and the report.
PRD ref: `prd.md > Evidence matching (the kernel)`, `prd.md > Missing words`, `prd.md > Gap prompts`, `prd.md > Saving and export`.

### UI controller (`js/app.js`)
Input persistence and counts, sample/clear, model chip, run flow with validation messages, rendering, row selection + CV highlight, filters, delta, copy/download, toast.
PRD ref: `prd.md > The Core Journey`, `prd.md > Re-map with delta`.

### Page and styles (`index.html`, `css/style.css`)
Static markup with a `<template>` for rows; responsive layout (one column under 900px).
PRD ref: `prd.md > Screens and Layout`, `prd.md > Look and Feel`.

## Data Model
- `localStorage['gapmap.inputs.v1'] = { job, cv }` — written on every input, read on load, cleared by **Clear**.
- In memory only: requirements `{id, text, kind, weight, section}`, evidence `{id, text, line}`, vectors (`number[384]`), result `{rows, fit, counts, missingTerms}`, and `last` (previous result for the delta).
- Nothing is sent over the network.

## File Structure
```
gapmap/
├── index.html                 # the page
├── css/style.css              # look and feel
├── js/
│   ├── app.js                 # UI controller
│   ├── engine.js              # splitting, scoring, prompts, Markdown (pure, testable)
│   ├── model.js               # Transformers.js setup + embed()
│   └── samples.js             # fictional sample job post and CV
├── vendor/                    # transformers.min.js + ONNX Runtime wasm (served locally)
├── models/Xenova/all-MiniLM-L6-v2/   # tokenizer + quantised ONNX weights
├── fonts/                     # self-hosted OFL fonts
├── tests/engine.test.mjs      # node:test unit tests for engine.js
├── devpost/                   # scope.md, prd.md, spec.md, checklist.md, app-map.html
├── .agents/skills/            # Devpost Learn Skill Pack used to plan and build this
├── README.md  LICENSE  package.json  .nojekyll
```

## External Services and Dependencies
- **None at runtime.** All model and runtime files are committed and served from the same origin.
- Hosting: GitHub Pages (free, static).
- Third-party code/data shipped: Transformers.js + ONNX Runtime Web (Apache-2.0 / MIT), all-MiniLM-L6-v2 weights (Apache-2.0), fonts (OFL). Credited in README.

## Important Failure Modes
- **WebAssembly or model fails to load** (very old browser, blocked file) → chip turns red, status says to reload; no results are invented.
- **Post pasted without bullets / mostly marketing text** → "I couldn't find requirement lines…" message.
- **Similarity misses a synonym the small model doesn't know** (e.g. "keyboard navigation" vs "WCAG") → shown as gap/partial with the closest lines visible, so the user can judge; the % is always shown.

## What Was Simplified and Why
- **Rule-based splitting** instead of an LLM parser — fast, predictable and testable; an LLM would need a big download or a server.
- **Fixed thresholds** instead of per-field calibration — enough to prove the idea; tuned on the sample plus manual checks.
- **Plain-text paste** instead of PDF parsing — proves the kernel without a PDF library.
- **Single-thread WASM** — GitHub Pages can't set the cross-origin-isolation headers needed for threads; speed is still a few seconds.

## Decisions and Open Issues
- On-device embeddings vs cloud LLM → on-device (privacy, zero cost, no keys); tradeoff: weaker language understanding, English only.
- Vendoring the model and runtime into the repo (~45 MB) vs loading from a CDN → vendored, so the "nothing leaves your device" promise is literally true and it works offline after first load; tradeoff: larger repo.
- Uncertainty explored: *"Can a small embedding model tell 'proves' from 'mentions'?"* — checked by running the sample through the model and reading the scores; a lone skills-list line scores lower than a concrete bullet, which is why exact tool names only add a small bonus rather than deciding the status.
- Open: threshold tuning for non-developer roles (from `prd.md > Open Questions`); can wait.
