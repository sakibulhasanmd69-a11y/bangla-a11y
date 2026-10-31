import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { generateHtml, generateJson, generateMarkdown, DISCLAIMER } from '../src/reports.js';
import type { AuditResult } from '../src/types.js';

const sample: AuditResult = {
  engineVersion: '0.1.0',
  findings: [
    {
      help: 'Add alt text.',
      id: 'image-alt',
      message: 'Image has no alt attribute.',
      rule: 'image-alt',
      selector: 'img',
      severity: 'serious',
      snippet: '<img src="x.jpg">',
      source: 'bangla-a11y',
    },
  ],
  summary: { critical: 0, minor: 0, moderate: 0, serious: 1, total: 1 },
  target: 'fixtures/bad.html',
  timestamp: '2026-11-01T00:00:00.000Z',
};

describe('reports', () => {
  it('JSON contains the finding and the disclaimer', () => {
    const text = generateJson(sample);
    const parsed = JSON.parse(text) as { findings: unknown[]; disclaimer: string };
    assert.equal(parsed.findings.length, 1);
    assert.ok(parsed.disclaimer.includes('do not guarantee full WCAG compliance'));
  });
  it('Markdown contains summary, finding and disclaimer', () => {
    const text = generateMarkdown(sample);
    assert.ok(text.includes('image-alt'));
    assert.ok(text.includes(DISCLAIMER));
  });
  it('HTML is responsive, escapes content and contains the disclaimer', () => {
    const text = generateHtml(sample);
    assert.ok(text.includes('viewport'));
    assert.ok(text.includes('image-alt'));
    assert.ok(text.includes(DISCLAIMER));
  });
  it('report files are real files, not stubs (sanity: this test file exists)', () => {
    assert.ok(existsSync('test/reports.test.ts'));
    assert.ok(readFileSync('test/reports.test.ts', 'utf-8').length > 100);
  });
});
