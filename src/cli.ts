import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { auditTarget } from './engine.js';
import { generateHtml, generateJson, generateMarkdown } from './reports.js';
import type { AuditOptions } from './types.js';

export const CLI_VERSION = '0.1.0';

export interface CliOptions {
  axeTags?: string[];
  format: 'all' | 'html' | 'json' | 'markdown';
  outDir: string;
  strict: boolean;
  target: string;
  timeoutMs?: number;
}

export function printHelp(): void {
  console.log(`BanglaA11y ${CLI_VERSION} — accessibility auditing for Bengali and English websites.

Usage:
  bangla-a11y audit <url-or-html-file> [--format html|json|markdown|all] [--out <dir>] [--strict] [--timeout <ms>] [--axe-tags <tag,tag>]
  bangla-a11y --help
  bangla-a11y --version

Options:
  --format   Report format. Default: all (writes report.html, report.json, report.md).
  --out      Output directory. Default: ./bangla-a11y-report
  --strict   Exit 1 if any critical or serious finding is reported.
  --timeout  Page navigation timeout in milliseconds. Default: 30000.
  --axe-tags Comma-separated axe-core rule tags to run, replacing the default
             wcag2a, wcag2aa, wcag21a, wcag21aa set (e.g. --axe-tags wcag2a,wcag2aa).

Notes:
  Automated checks do not guarantee full WCAG compliance. Manual testing
  with assistive technology and keyboard-only use is still required.
  The CLI never publishes to npm or spends money; it only audits locally.`);
}

export function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }
  if (args.includes('--version') || args.includes('-v')) {
    console.log(CLI_VERSION);
    process.exit(0);
  }
  if (args[0] !== 'audit' || !args[1]) {
    console.error(
      'Usage: bangla-a11y audit <url-or-html-file> [--format html|json|markdown|all] [--out <dir>] [--strict] [--timeout <ms>] [--axe-tags <tag,tag>]',
    );
    process.exit(2);
  }
  let format: CliOptions['format'] = 'all';
  let outDir = './bangla-a11y-report';
  let strict = false;
  let timeoutMs: number | undefined;
  let axeTags: string[] | undefined;
  for (let i = 2; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--format') {
      const value = args[i + 1];
      if (value === 'html' || value === 'json' || value === 'markdown' || value === 'all') {
        format = value;
        i += 1;
      } else {
        console.error(`Unknown --format value: ${value ?? '(missing)'}`);
        process.exit(2);
      }
    } else if (arg === '--out') {
      const value = args[i + 1];
      if (!value) {
        console.error('Missing value for --out');
        process.exit(2);
      }
      outDir = value;
      i += 1;
    } else if (arg === '--strict') {
      strict = true;
    } else if (arg === '--timeout') {
      const value = args[i + 1];
      const parsed = value === undefined ? Number.NaN : Number(value);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        console.error(
          `Invalid --timeout value: ${value ?? '(missing)'} (expected a positive integer in ms)`,
        );
        process.exit(2);
      }
      timeoutMs = parsed;
      i += 1;
    } else if (arg === '--axe-tags') {
      const value = args[i + 1];
      const tags = (value ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '');
      if (tags.length === 0) {
        console.error('Missing value for --axe-tags (expected a comma-separated tag list)');
        process.exit(2);
      }
      axeTags = tags;
      i += 1;
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  const options: CliOptions = { format, outDir, strict, target: args[1] as string };
  if (axeTags !== undefined) options.axeTags = axeTags;
  if (timeoutMs !== undefined) options.timeoutMs = timeoutMs;
  return options;
}

export async function runCli(options: CliOptions): Promise<number> {
  const auditOptions: AuditOptions = {};
  if (options.axeTags !== undefined) auditOptions.axeTags = options.axeTags;
  if (options.timeoutMs !== undefined) auditOptions.timeoutMs = options.timeoutMs;
  const result = await auditTarget(options.target, auditOptions);
  const outDir = resolve(options.outDir);
  await mkdir(outDir, { recursive: true });
  const written: string[] = [];
  const write = async (name: string, content: string): Promise<void> => {
    const path = join(outDir, name);
    await writeFile(path, content, 'utf-8');
    written.push(path);
  };
  if (options.format === 'all' || options.format === 'html')
    await write('report.html', generateHtml(result));
  if (options.format === 'all' || options.format === 'json')
    await write('report.json', generateJson(result));
  if (options.format === 'all' || options.format === 'markdown')
    await write('report.md', generateMarkdown(result));

  console.log(`Target: ${result.target}`);
  console.log(
    `Findings: ${result.summary.total} total (${result.summary.critical} critical, ${result.summary.serious} serious, ${result.summary.moderate} moderate, ${result.summary.minor} minor)`,
  );
  for (const file of written) console.log(`Wrote ${file}`);
  if (options.strict && (result.summary.critical > 0 || result.summary.serious > 0)) {
    console.error('Strict mode: critical or serious findings present.');
    return 1;
  }
  return 0;
}
