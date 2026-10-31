import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { join } from 'node:path';
import { auditTarget } from '../src/engine.js';

const fixtures = (name: string): string => join(process.cwd(), 'fixtures', name);

const hasRule = (result: { findings: { rule: string }[] }, rule: string): boolean =>
  result.findings.some((finding) => finding.rule === rule);

describe('engine: bad fixture', () => {
  it('finds missing alt, missing labels, heading problems, lang and keyboard issues', async () => {
    const result = await auditTarget(fixtures('bad.html'));
    assert.ok(result.summary.total > 0);
    assert.ok(hasRule(result, 'image-alt'), 'expected an image-alt finding');
    assert.ok(hasRule(result, 'form-label'), 'expected a form-label finding');
    assert.ok(hasRule(result, 'heading-order'), 'expected a heading-order finding');
    assert.ok(hasRule(result, 'html-lang'), 'expected an html-lang finding');
    assert.ok(hasRule(result, 'keyboard'), 'expected a keyboard finding');
    assert.ok(hasRule(result, 'color-contrast'), 'expected a color-contrast finding');
    assert.equal(result.summary.total, result.findings.length);
  });
});

describe('engine: good fixture', () => {
  it('does not report the basic custom-check failures', async () => {
    const result = await auditTarget(fixtures('good.html'));
    for (const rule of [
      'image-alt',
      'form-label',
      'heading-order',
      'html-lang',
      'color-contrast',
    ]) {
      assert.ok(
        !result.findings.some((f) => f.rule === rule && f.source === 'bangla-a11y'),
        `unexpected custom ${rule} finding`,
      );
    }
  });
});

describe('engine: Bengali fixtures', () => {
  it('accepts a Bengali page declared lang=bn', async () => {
    const result = await auditTarget(fixtures('bengali.html'));
    assert.ok(
      !hasRule(result, 'html-lang'),
      'Bengali page with lang=bn should not get a lang finding',
    );
  });

  it('flags a Bengali page declared lang=en', async () => {
    const result = await auditTarget(fixtures('bengali-mismatch.html'));
    assert.ok(hasRule(result, 'html-lang'), 'expected an html-lang mismatch finding');
  });
});

describe('engine: RTL fixture', () => {
  it('flags mostly-RTL content without dir=rtl', async () => {
    const result = await auditTarget(fixtures('rtl.html'));
    assert.ok(hasRule(result, 'rtl-layout'), 'expected an rtl-layout finding');
  });
});
