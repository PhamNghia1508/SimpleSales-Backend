import { splitRequirements, splitEvidence, scoreMatches, proofPrompt, toMarkdown, truncate } from './engine.js';
import { loadModel, embed } from './model.js';
import { SAMPLE_JOB, SAMPLE_CV } from './samples.js';

const $ = (id) => document.getElementById(id);
const els = {
  job: $('job'), cv: $('cv'), jobCount: $('jobCount'), cvCount: $('cvCount'),
  mapBtn: $('mapBtn'), sampleBtn: $('sampleBtn'), clearBtn: $('clearBtn'), status: $('status'),
  chip: $('modelChip'), chipText: $('modelText'),
  results: $('results'), rows: $('rows'), cvView: $('cvView'), missing: $('missing'), missingWrap: $('missingWrap'),
  fitNum: $('fitNum'), ringFg: $('ringFg'), verdict: $('verdict'),
  nProven: $('nProven'), nPartial: $('nPartial'), nGap: $('nGap'),
  delta: $('delta'), copyBtn: $('copyBtn'), editBtn: $('editBtn'), tpl: $('rowTpl'),
};
const STORE = 'gapmap.inputs.v1';
const LABEL = { proven: 'Proven', partial: 'Partial', gap: 'Gap' };
let last = null;

// ---------- inputs ----------
function words(s) { return (s.trim().match(/\S+/g) || []).length; }
function syncCounts() {
  els.jobCount.textContent = `${words(els.job.value)} words`;
  els.cvCount.textContent = `${words(els.cv.value)} words`;
  localStorage.setItem(STORE, JSON.stringify({ job: els.job.value, cv: els.cv.value }));
}
try {
  const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
  if (saved) { els.job.value = saved.job || ''; els.cv.value = saved.cv || ''; }
} catch { /* ignore corrupt storage */ }
syncCounts();
els.job.addEventListener('input', syncCounts);
els.cv.addEventListener('input', syncCounts);

els.sampleBtn.addEventListener('click', () => {
  els.job.value = SAMPLE_JOB; els.cv.value = SAMPLE_CV; syncCounts();
  setStatus('Sample loaded — a fictional job post and CV.');
  warmModel();
});
els.clearBtn.addEventListener('click', () => {
  els.job.value = ''; els.cv.value = ''; syncCounts();
  els.results.hidden = true; setStatus('');
  els.job.focus();
});

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.classList.toggle('error', isError);
}

// ---------- model ----------
function setChip(state, text) { els.chip.dataset.state = state; els.chipText.textContent = text; }
let warming = null;
function warmModel() {
  if (!warming) {
    setChip('loading', 'Loading on-device AI model… 0%');
    warming = loadModel((p) => setChip('loading', `Loading on-device AI model… ${p}%`))
      .then(() => setChip('ready', 'AI model ready · runs offline in your browser'))
      .catch((e) => { warming = null; setChip('error', 'Model failed to load'); throw e; });
  }
  return warming;
}
els.job.addEventListener('focus', () => warmModel().catch(() => {}), { once: true });
els.cv.addEventListener('focus', () => warmModel().catch(() => {}), { once: true });

// ---------- run ----------
els.mapBtn.addEventListener('click', run);
async function run() {
  const job = els.job.value.trim();
  const cv = els.cv.value.trim();
  if (!job || !cv) {
    setStatus(!job && !cv ? 'Paste a job post and your CV first — or try the sample.' : !job ? 'Paste the job post first.' : 'Paste your CV first.', true);
    (!job ? els.job : els.cv).focus();
    return;
  }
  const reqs = splitRequirements(job);
  const evidence = splitEvidence(cv);
  if (!reqs.length) { setStatus('I couldn’t find requirement lines. Paste the part of the post with the bullet points.', true); return; }
  if (!evidence.length) { setStatus('Your CV looks too short to compare — paste your experience bullets.', true); return; }

  els.mapBtn.disabled = true;
  try {
    setStatus('Loading the AI model (first time only)…');
    await warmModel();
    setStatus(`Reading ${reqs.length} requirements and ${evidence.length} CV lines…`);
    const t0 = performance.now();
    const vecs = await embed([...reqs.map((r) => r.text), ...evidence.map((e) => e.text)]);
    const result = scoreMatches(reqs, evidence, vecs.slice(0, reqs.length), vecs.slice(reqs.length), cv);
    const ms = Math.round(performance.now() - t0);
    const prevFit = last ? last.result.fit : null;
    last = { result, cv };
    render(result, cv, prevFit);
    setStatus(`Mapped ${reqs.length} requirements in ${(ms / 1000).toFixed(1)} s — on this device.`);
    els.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    console.error(e);
    setStatus('Something went wrong loading the AI model. Reload the page and try again.', true);
  } finally {
    els.mapBtn.disabled = false;
  }
}

// ---------- render ----------
function verdictFor(fit, counts) {
  const mustGaps = last.result.rows.filter((r) => r.status === 'gap' && r.req.kind === 'must').length;
  if (fit >= 80) return 'Strong match — your CV proves almost everything.';
  if (fit >= 60) return `Good base. ${mustGaps ? `${mustGaps} must-have${mustGaps > 1 ? 's' : ''} still unproven.` : 'Tighten the partial ones.'}`;
  if (fit >= 40) return `Worth applying only after you close ${counts.gap} gap${counts.gap === 1 ? '' : 's'}.`;
  return 'Big stretch — this CV doesn’t show most of what they ask for.';
}

function render(result, cvText, prevFit = null) {
  els.results.hidden = false;
  // summary
  const C = 326.7;
  els.ringFg.style.strokeDashoffset = C;
  els.ringFg.style.stroke = result.fit >= 60 ? 'var(--proven)' : result.fit >= 40 ? 'var(--partial)' : 'var(--gap)';
  requestAnimationFrame(() => requestAnimationFrame(() => { els.ringFg.style.strokeDashoffset = C * (1 - result.fit / 100); }));
  countUp(els.fitNum, result.fit);
  els.verdict.textContent = verdictFor(result.fit, result.counts);
  const d = prevFit === null ? 0 : result.fit - prevFit;
  els.delta.hidden = !d;
  if (d) {
    els.delta.textContent = `${d > 0 ? '+' : ''}${d} pts since your last map`;
    els.delta.className = 'delta ' + (d > 0 ? 'up' : 'down');
  }
  els.nProven.textContent = result.counts.proven;
  els.nPartial.textContent = result.counts.partial;
  els.nGap.textContent = result.counts.gap;
  els.missing.replaceChildren(...result.missingTerms.map((t) => Object.assign(document.createElement('span'), { className: 'chip', textContent: t })));
  els.missingWrap.hidden = !result.missingTerms.length;
  setFilter('all');

  // CV view
  const lines = cvText.split(/\r?\n/);
  const use = new Map();
  for (const r of result.rows) {
    if (r.status === 'gap') continue;
    const ln = r.top[0].evidence.line;
    if (use.get(ln) !== 'proven') use.set(ln, r.status);
  }
  els.cvView.replaceChildren(...lines.map((text, i) => {
    const d = document.createElement('div');
    d.className = 'cvline' + (text.trim() ? '' : ' blank') + (use.has(i) ? ` uses-${use.get(i)}` : '');
    d.dataset.line = i;
    if (text.trim()) {
      const n = document.createElement('span'); n.className = 'ln'; n.textContent = i + 1;
      const t = document.createElement('span'); t.textContent = text;
      d.append(n, t);
    }
    return d;
  }));

  // rows
  const order = { gap: 0, partial: 1, proven: 2 };
  const rows = [...result.rows].sort((a, b) => (a.req.kind === b.req.kind ? 0 : a.req.kind === 'must' ? -1 : 1) || order[a.status] - order[b.status] || b.score - a.score);
  els.rows.replaceChildren(...rows.map((r, idx) => buildRow(r, idx)));
}

function buildRow(r, idx) {
  const li = els.tpl.content.firstElementChild.cloneNode(true);
  li.classList.add(r.status);
  li.dataset.status = r.status;
  li.style.animationDelay = `${idx * 35}ms`;
  li.querySelector('.pill').textContent = LABEL[r.status];
  li.querySelector('.req-text').textContent = r.req.text;
  li.querySelector('.kind').textContent = r.req.kind === 'nice' ? 'nice to have' : 'must have';
  const best = r.top[0];
  li.querySelector('.proof-text').textContent = r.status === 'gap'
    ? 'No line in your CV proves this.'
    : `“${truncate(best.evidence.text, 140)}”`;
  li.querySelector('.score').textContent = r.status === 'gap'
    ? `closest match ${pct(best.score)}`
    : `match ${pct(best.score)} · CV line ${best.evidence.line + 1}`;
  li.querySelector('.cands').replaceChildren(...r.top.map((c) => {
    const item = document.createElement('li');
    const bar = document.createElement('span'); bar.className = 'bar'; bar.textContent = pct(c.score);
    const txt = document.createElement('span'); txt.textContent = c.evidence.text;
    item.append(bar, txt);
    return item;
  }));
  const prompt = li.querySelector('.prompt');
  if (r.status === 'proven') {
    prompt.innerHTML = '<b>Looks good</b>';
    prompt.append('This line is your proof. Keep it near the top of your CV for this application.');
  } else {
    prompt.innerHTML = `<b>${r.status === 'gap' ? 'How to close this gap' : 'How to make it explicit'}</b>`;
    prompt.append(proofPrompt(r));
  }
  const select = () => {
    const was = li.classList.contains('selected');
    els.rows.querySelectorAll('.row.selected').forEach((x) => x.classList.remove('selected'));
    els.cvView.querySelectorAll('.focus').forEach((x) => x.classList.remove('focus'));
    if (was) return;
    li.classList.add('selected');
    if (r.status !== 'gap') {
      const line = els.cvView.querySelector(`[data-line="${best.evidence.line}"]`);
      if (line) { line.classList.add('focus'); line.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
  };
  li.addEventListener('click', select);
  li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
  return li;
}

function pct(x) { return `${Math.round(x * 100)}%`; }
function countUp(el, to) {
  const start = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - start) / 900);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- filters & actions ----------
document.querySelectorAll('.tally-item').forEach((b) => b.addEventListener('click', () => setFilter(b.dataset.filter)));
function setFilter(f) {
  document.querySelectorAll('.tally-item').forEach((b) => b.classList.toggle('active', b.dataset.filter === f));
  els.rows.querySelectorAll('.row').forEach((r) => { r.hidden = f !== 'all' && r.dataset.status !== f; });
}

els.copyBtn.addEventListener('click', async () => {
  if (!last) return;
  const md = toMarkdown(last.result);
  try { await navigator.clipboard.writeText(md); toast('Report copied — paste it into your notes'); }
  catch {
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'gapmap-report.md' });
    a.click(); toast('Report downloaded as gapmap-report.md');
  }
});
els.editBtn.addEventListener('click', () => { document.getElementById('inputs').scrollIntoView({ behavior: 'smooth' }); els.cv.focus({ preventScroll: true }); });

function toast(msg) {
  const t = Object.assign(document.createElement('div'), { className: 'toast', textContent: msg });
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}
