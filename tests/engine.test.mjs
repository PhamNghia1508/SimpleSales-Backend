// Run with: node --test tests/
// Tests the deterministic parts of GapMap (parsing + scoring) with hand-made vectors,
// so they need no model download.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  splitRequirements, splitEvidence, scoreMatches, distinctiveTerms, lexicalOverlap, statusFor, toMarkdown,
} from '../js/engine.js';
import { SAMPLE_JOB, SAMPLE_CV } from '../js/samples.js';

test('job post: keeps bullets, drops headings, about-us and benefits', () => {
  const reqs = splitRequirements(SAMPLE_JOB);
  const texts = reqs.map((r) => r.text);
  assert.ok(texts.includes('Write TypeScript that other engineers can read and maintain'));
  assert.ok(!texts.some((t) => /checkout tools/.test(t)), 'about-us section skipped');
  assert.ok(!texts.some((t) => /health insurance/.test(t)), 'benefits skipped');
  assert.ok(!texts.some((t) => /^Requirements$/.test(t)), 'headings are not requirements');
  assert.equal(reqs.length, 13);
});

test('job post: nice-to-have section is weighted half', () => {
  const reqs = splitRequirements(SAMPLE_JOB);
  const wcag = reqs.find((r) => /WCAG/.test(r.text));
  const react = reqs.find((r) => /1\+ years/.test(r.text));
  assert.equal(wcag.kind, 'nice');
  assert.equal(wcag.weight, 0.5);
  assert.equal(react.kind, 'must');
});

test('CV: keeps line numbers for highlighting', () => {
  const ev = splitEvidence(SAMPLE_CV);
  const lines = SAMPLE_CV.split('\n');
  for (const e of ev) assert.ok(lines[e.line].includes(e.text.slice(0, 10)));
});

test('distinctive terms pick out tools and acronyms', () => {
  assert.deepEqual(distinctiveTerms('Write unit tests for UI logic with Jest or Vitest'), ['UI', 'Jest', 'Vitest']);
  assert.ok(distinctiveTerms('Experience with Next.js or server-side rendering').includes('Next.js'));
});

test('lexical overlap is whole-word and case-insensitive', () => {
  assert.equal(lexicalOverlap(['React'], 'built with react hooks'), 1);
  assert.equal(lexicalOverlap(['Java'], 'JavaScript only'), 0);
});

test('status thresholds use the rounded percentage', () => {
  assert.equal(statusFor(0.5199), 'proven');
  assert.equal(statusFor(0.45), 'partial');
  assert.equal(statusFor(0.2), 'gap');
});

test('scoring: fit, counts and missing words', () => {
  const reqs = [
    { id: 0, text: 'Build React components', kind: 'must', weight: 1 },
    { id: 1, text: 'Write tests with Jest', kind: 'must', weight: 1 },
  ];
  const ev = [{ id: 0, text: 'Built React components for a dashboard', line: 0 }];
  const rv = [[1, 0], [0, 1]];
  const evv = [[0.9, 0.1]];
  const res = scoreMatches(reqs, ev, rv, evv, 'Built React components for a dashboard');
  assert.equal(res.rows[0].status, 'proven');
  assert.equal(res.rows[1].status, 'gap');
  assert.equal(res.fit, 50);
  assert.deepEqual(res.missingTerms, ['Jest']);
  assert.match(toMarkdown(res), /Fit: 50%/);
});
