import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { AxeBuilder } from '@axe-core/playwright';
import { chromium, type Page } from 'playwright';
import { runCustomChecks, toFinding } from './checks.js';
import {
  summarize,
  type AuditOptions,
  type AuditResult,
  type Finding,
  type Severity,
} from './types.js';

export const ENGINE_VERSION = '0.1.0';

const AXE_IMPACT_TO_SEVERITY: Record<string, Severity> = {
  critical: 'critical',
  minor: 'minor',
  moderate: 'moderate',
  serious: 'serious',
};

function isUrl(target: string): boolean {
  return /^https?:\/\//i.test(target);
}

async function collectFindings(page: Page, options: AuditOptions): Promise<Finding[]> {
  const findings: Finding[] = [];

  // axe-core: the primary WCAG rule engine.
  try {
    const axe = new AxeBuilder({ page }).withTags(
      options.axeTags ?? ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    );
    const results = await axe.analyze();
    for (const violation of results.violations) {
      const severity = AXE_IMPACT_TO_SEVERITY[violation.impact ?? 'moderate'] ?? 'moderate';
      for (const node of violation.nodes) {
        findings.push({
          help: violation.help,
          id: violation.id,
          message: violation.description,
          rule: violation.id,
          selector: node.target.join(', '),
          severity,
          snippet: node.html.slice(0, 200),
          source: 'axe',
        });
      }
    }
  } catch (error) {
    // axe must not silently disappear: surface it as a finding so a report
    // never looks clean merely because the rule engine failed.
    findings.push({
      help: 'axe-core could not run on this page; custom BanglaA11y checks still ran.',
      id: 'axe-run-failed',
      message: `axe-core failed: ${error instanceof Error ? error.message : String(error)}`,
      rule: 'axe-run-failed',
      severity: 'minor',
      source: 'axe',
    });
  }

  // BanglaA11y custom checks (Bengali/RTL/keyboard/lang aware).
  const raw = await page.evaluate(runCustomChecks);
  for (const item of raw) findings.push(toFinding(item));

  return findings;
}

async function auditPage(page: Page, options: AuditOptions): Promise<Finding[]> {
  return collectFindings(page, options);
}

/**
 * Audit a URL (http/https) or a local HTML file path.
 * For local files the HTML is loaded with page.setContent, so fixtures need
 * no web server. Returns findings sorted critical-first, then by rule.
 */
export async function auditTarget(
  target: string,
  options: AuditOptions = {},
): Promise<AuditResult> {
  const timeoutMs = options.timeoutMs ?? 30000;
  const browser = await chromium.launch({
    args: ['--no-sandbox'],
    headless: options.headless ?? true,
  });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(timeoutMs);
    if (isUrl(target)) {
      await page.goto(target, { timeout: timeoutMs, waitUntil: 'domcontentloaded' });
    } else if (existsSync(target)) {
      const html = await readFile(target, 'utf-8');
      await page.setContent(html, { timeout: timeoutMs, waitUntil: 'domcontentloaded' });
    } else {
      throw new Error(`Target is neither a URL nor an existing file: ${target}`);
    }
    // Let simple client-side rendering settle before checking.
    await page.waitForTimeout(500);
    const findings = await auditPage(page, options);
    const severityOrder: Record<Severity, number> = {
      critical: 0,
      minor: 3,
      moderate: 2,
      serious: 1,
    };
    findings.sort(
      (a, b) =>
        severityOrder[a.severity] - severityOrder[b.severity] || a.rule.localeCompare(b.rule),
    );
    return {
      engineVersion: ENGINE_VERSION,
      findings,
      summary: summarize(findings),
      target,
      timestamp: new Date().toISOString(),
    };
  } finally {
    await browser.close();
  }
}

/** Audit raw HTML text directly (used by tests and by library consumers). */
export async function auditHtml(html: string, options: AuditOptions = {}): Promise<AuditResult> {
  const browser = await chromium.launch({
    args: ['--no-sandbox'],
    headless: options.headless ?? true,
  });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const findings = await auditPage(page, options);
    return {
      engineVersion: ENGINE_VERSION,
      findings,
      summary: summarize(findings),
      target: '<html>',
      timestamp: new Date().toISOString(),
    };
  } finally {
    await browser.close();
  }
}
