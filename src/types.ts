export type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

export type FindingSource = 'axe' | 'bangla-a11y';

export interface Finding {
  help?: string;
  id: string;
  message: string;
  rule: string;
  selector?: string;
  severity: Severity;
  snippet?: string;
  source: FindingSource;
}

export interface AuditSummary {
  critical: number;
  minor: number;
  moderate: number;
  serious: number;
  total: number;
}

export interface AuditResult {
  engineVersion: string;
  findings: Finding[];
  summary: AuditSummary;
  target: string;
  timestamp: string;
}

export interface AuditOptions {
  /** Axe-core rule tags to run, replacing the WCAG 2.x A/AA defaults when set. */
  axeTags?: string[];
  /** Browser launch headless flag. Defaults to true. */
  headless?: boolean;
  /** Navigation / page timeout in milliseconds. Defaults to 30000. */
  timeoutMs?: number;
}

export function summarize(findings: Finding[]): AuditSummary {
  const summary: AuditSummary = {
    critical: 0,
    minor: 0,
    moderate: 0,
    serious: 0,
    total: findings.length,
  };
  for (const finding of findings) {
    summary[finding.severity] += 1;
  }
  return summary;
}

/** Content languages BanglaA11y can reason about. `unknown` means too little text to tell. */
export type ContentLanguage = 'bn' | 'en' | 'mixed' | 'rtl' | 'unknown';
