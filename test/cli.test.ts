import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

describe('CLI integration', () => {
  it('audits a local fixture and writes html, json and markdown reports', () => {
    const outDir = mkdtempSync(join(tmpdir(), 'bangla-a11y-cli-'));
    const cli = join(process.cwd(), 'dist', 'src', 'bin.js');
    const stdout = execFileSync(
      'node',
      [
        cli,
        'audit',
        join(process.cwd(), 'fixtures', 'bad.html'),
        '--format',
        'all',
        '--out',
        outDir,
      ],
      { encoding: 'utf-8' },
    );
    assert.ok(stdout.includes('Findings:'));
    for (const name of ['report.html', 'report.json', 'report.md']) {
      const path = join(outDir, name);
      assert.ok(existsSync(path), `${name} should exist`);
      assert.ok(readFileSync(path, 'utf-8').length > 100, `${name} should not be empty`);
    }
    const json = JSON.parse(readFileSync(join(outDir, 'report.json'), 'utf-8')) as {
      findings: { rule: string }[];
    };
    assert.ok(
      json.findings.some((f) => f.rule === 'image-alt'),
      'JSON report should contain an image-alt finding',
    );
    const md = readFileSync(join(outDir, 'report.md'), 'utf-8');
    assert.ok(md.includes('do not guarantee full WCAG compliance'));
  });

  it('--help exits 0 and describes audit', () => {
    const cli = join(process.cwd(), 'dist', 'src', 'bin.js');
    const stdout = execFileSync('node', [cli, '--help'], { encoding: 'utf-8' });
    assert.ok(stdout.includes('bangla-a11y audit'));
  });
});
