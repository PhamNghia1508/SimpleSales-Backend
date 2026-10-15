// GapMap engine — pure functions, no DOM.
// Splits a job post into requirements and a CV into evidence lines, then
// scores every requirement against every evidence line using sentence
// embeddings (semantic) plus a small exact-keyword bonus (lexical).
// The embedder is injected so the same code runs in the browser and in tests.

export const THRESHOLDS = { proven: 0.52, partial: 0.42 };

const STOP = new Set(`a an the and or of to in on for with at by from as is are be been being was were will would can could should
must have has had having do does did you your we our us they their this that these those it its into over under across within
about such than then also more most other any all each per via etc able ability strong solid good great excellent proven experience
experienced years year plus using use used work working knowledge understanding familiarity familiar skills skill including include
like well new team teams role candidate ideal who what how why when where while who's i me my mine help helping make making build
building based least ideally preferred nice bonus least`.split(/\s+/));

const BOILERPLATE = /(equal opportunity|we offer|benefits|salary|compensation|apply now|about us|about the company|our mission|perks|paid time off|health insurance|location:|remote-first|hybrid|how to apply|send your|we are an?|we're an?|join us|who we are)/i;
const NICE_HEADING = /(nice to have|nice-to-have|bonus|preferred|a plus|good to have|extra credit)/i;
const NICE_INLINE = /(nice to have|is a plus|are a plus|a bonus|preferred|bonus points|ideally)/i;
const MUST_HEADING = /(requirement|qualification|must have|must-have|what you('|’)ll need|you have|what we('|’)re looking for|responsibilit|what you('|’)ll do|skills)/i;

const SKIP_SECTION = /(about (us|the (company|team|role))|who we are|benefits|we offer|perks|how to apply|our mission|compensation)/i;

const BULLET = /^\s*(?:[-*•·▪◦‣–—>]|\d+[.)]|[a-z][.)])\s+/i;

export function cleanLine(s) {
  return s.replace(BULLET, '').replace(/\s+/g, ' ').trim();
}

function wordCount(s) {
  return (s.match(/[\p{L}\p{N}+#.]+/gu) || []).length;
}

function isHeading(raw) {
  const s = raw.trim();
  if (!s) return false;
  if (BULLET.test(raw)) return false;
  if (/:\s*$/.test(s) && wordCount(s) <= 8) return true;
  if (wordCount(s) <= 5 && !/[.,;]/.test(s)) return true;
  return false;
}

// Split long lines at sentence ends and semicolons so one bullet = one claim.
function splitClaims(line) {
  return line
    .split(/(?<=[.!?])\s+(?=[A-Z])|;\s+/)
    .map((x) => x.trim().replace(/[.;]+$/, ''))
    .filter(Boolean);
}

/** Job post -> [{id, text, weight, kind: 'must'|'nice', section}] */
export function splitRequirements(jd) {
  const out = [];
  let section = '';
  let sectionIsNice = false;
  let skipping = false;
  for (const raw of jd.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    if (isHeading(raw)) {
      section = raw.trim().replace(/:\s*$/, '');
      sectionIsNice = NICE_HEADING.test(section);
      skipping = SKIP_SECTION.test(section);
      continue;
    }
    if (skipping) continue;
    const line = cleanLine(raw);
    for (const claim of splitClaims(line)) {
      if (wordCount(claim) < 4) continue;
      if (BOILERPLATE.test(claim)) continue;
      const nice = sectionIsNice || NICE_INLINE.test(claim);
      out.push({ id: out.length, text: claim, kind: nice ? 'nice' : 'must', weight: nice ? 0.5 : 1, section });
    }
  }
  return out;
}

/** CV -> [{id, text, line}] where line is the source line index (for highlighting) */
export function splitEvidence(cv) {
  const out = [];
  cv.split(/\r?\n/).forEach((raw, lineIdx) => {
    if (!raw.trim()) return;
    const line = cleanLine(raw);
    const parts = wordCount(line) > 28 ? splitClaims(line) : [line];
    for (const p of parts) {
      if (wordCount(p) < 3) continue;
      out.push({ id: out.length, text: p, line: lineIdx });
    }
  });
  return out;
}

export function keyTerms(s) {
  return [...new Set(
    (s.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}+#./-]*/gu) || [])
      .map((t) => t.replace(/[.\-/]+$/, ''))
      .filter((t) => t.length > 1 && !STOP.has(t) && !/^\d+$/.test(t))
  )];
}

/**
 * Skill-like words in the original casing: tools, acronyms and proper nouns
 * (TypeScript, WCAG, Next.js, C#, English). Sentence-initial words only count
 * when they are clearly not ordinary words (mixed case, digits or symbols).
 */
export function distinctiveTerms(s) {
  const out = new Set();
  const tokens = s.match(/[\p{L}\p{N}][\p{L}\p{N}+#./-]*/gu) || [];
  tokens.forEach((raw, i) => {
    const t = raw.replace(/[.\-/]+$/, '');
    if (t.length < 2) return;
    if (STOP.has(t.toLowerCase())) return;
    const symbolic = /[+#.]|\d/.test(t) && /\p{L}/u.test(t);
    const acronym = /^[A-Z]{2,}s?$/.test(t);
    const mixed = /[a-z][A-Z]/.test(t);
    const capital = /^[A-Z]/.test(t) && i > 0;
    if (symbolic || acronym || mixed || capital) out.add(t);
  });
  return [...out];
}

export function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** Share of a requirement's key terms that literally appear in the evidence. */
export function lexicalOverlap(reqTerms, evText) {
  if (!reqTerms.length) return 0;
  const ev = ' ' + evText.toLowerCase() + ' ';
  let hit = 0;
  for (const term of reqTerms) {
    const t = term.toLowerCase();
    const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(^|[^\\p{L}\\p{N}])${esc}($|[^\\p{L}\\p{N}])`, 'u').test(ev)) hit++;
  }
  return hit / reqTerms.length;
}

export function statusFor(score) {
  // Compare on the rounded percentage the UI shows, so "52%" never reads as two different statuses.
  const pct = Math.round(score * 100);
  if (pct >= Math.round(THRESHOLDS.proven * 100)) return 'proven';
  if (pct >= Math.round(THRESHOLDS.partial * 100)) return 'partial';
  return 'gap';
}

/**
 * Core scoring. reqVecs/evVecs are L2-normalised embeddings (arrays of numbers).
 * Returns per-requirement matches (top 3 evidence each), the fit score,
 * and the job-post terms that never appear anywhere in the CV.
 */
export function scoreMatches(reqs, evidence, reqVecs, evVecs, cvText) {
  const cvLower = cvText.toLowerCase();
  const rows = reqs.map((r, i) => {
    const terms = keyTerms(r.text);
    const skills = distinctiveTerms(r.text);
    const cands = evidence.map((e, j) => {
      const semantic = dot(reqVecs[i], evVecs[j]);
      const lexical = lexicalOverlap(terms, e.text);
      const skillHit = skills.length ? lexicalOverlap(skills, e.text) > 0 : false;
      const score = Math.min(1, semantic + 0.12 * lexical + (skillHit ? 0.08 : 0));
      return { evidence: e, semantic, lexical, score };
    }).sort((a, b) => b.score - a.score);
    const best = cands[0];
    const score = best ? best.score : 0;
    return { req: r, terms, skills, status: statusFor(score), score, top: cands.slice(0, 3) };
  });

  const credit = { proven: 1, partial: 0.5, gap: 0 };
  const total = rows.reduce((s, r) => s + r.req.weight, 0) || 1;
  const earned = rows.reduce((s, r) => s + r.req.weight * credit[r.status], 0);
  const fit = Math.round((earned / total) * 100);

  const missing = new Map();
  for (const r of rows) {
    if (r.status === 'proven') continue;
    for (const term of r.skills) {
      const t = term.toLowerCase();
      const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`(^|[^\\p{L}\\p{N}])${esc}($|[^\\p{L}\\p{N}])`, 'u').test(cvLower)) {
        missing.set(term, (missing.get(term) || 0) + r.req.weight);
      }
    }
  }
  const missingTerms = [...missing.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t);

  const counts = { proven: 0, partial: 0, gap: 0 };
  rows.forEach((r) => counts[r.status]++);
  return { rows, fit, counts, missingTerms };
}

/** A concrete, honest prompt for closing a gap — never invents experience. */
export function proofPrompt(row) {
  const terms = (row.skills.length ? row.skills : row.terms).slice(0, 3).join(', ');
  if (row.status === 'partial') {
    const ev = row.top[0]?.evidence.text || '';
    return `Your line “${truncate(ev, 80)}” is close. If it's true, make it explicit: name ${terms || 'the skill'} and add a result (a number, a user, a shipped thing).`;
  }
  return `Have you done this anywhere — a class project, internship, side project? If yes, add one bullet: what you did with ${terms || 'it'}, and what changed because of it. If not, this is a real gap to learn or to address in your cover letter.`;
}

export function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

export function toMarkdown(result, meta = {}) {
  const icon = { proven: '✅', partial: '🟡', gap: '❌' };
  const lines = [];
  lines.push(`# GapMap report${meta.title ? ` — ${meta.title}` : ''}`);
  lines.push('');
  lines.push(`**Fit: ${result.fit}%** · ${result.counts.proven} proven · ${result.counts.partial} partial · ${result.counts.gap} gaps`);
  lines.push('');
  for (const r of result.rows) {
    lines.push(`- ${icon[r.status]} **${r.req.text}**${r.req.kind === 'nice' ? ' _(nice to have)_' : ''}`);
    if (r.status !== 'gap' && r.top[0]) lines.push(`  - Evidence (${Math.round(r.score * 100)}%): “${r.top[0].evidence.text}”`);
    if (r.status !== 'proven') lines.push(`  - Next step: ${proofPrompt(r)}`);
  }
  if (result.missingTerms.length) {
    lines.push('');
    lines.push(`**Words the post uses that your CV never does:** ${result.missingTerms.join(', ')}`);
  }
  lines.push('');
  lines.push('_Generated on-device by GapMap. Nothing was uploaded._');
  return lines.join('\n');
}
