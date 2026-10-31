import type { AuditResult } from './types.js';

export const DISCLAIMER =
  'Automated checks do not guarantee full WCAG compliance. ' +
  'Manual testing with assistive technology and keyboard-only use is still required.';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function generateJson(result: AuditResult): string {
  return JSON.stringify({ ...result, disclaimer: DISCLAIMER }, null, 2) + '\n';
}

export function generateMarkdown(result: AuditResult): string {
  const lines: string[] = [];
  lines.push('# BanglaA11y Accessibility Report');
  lines.push('');
  lines.push(`- **Target:** ${result.target}`);
  lines.push(`- **Generated:** ${result.timestamp}`);
  lines.push(`- **Engine:** BanglaA11y ${result.engineVersion}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Severity | Count |`);
  lines.push(`| --- | ---: |`);
  lines.push(`| Critical | ${result.summary.critical} |`);
  lines.push(`| Serious | ${result.summary.serious} |`);
  lines.push(`| Moderate | ${result.summary.moderate} |`);
  lines.push(`| Minor | ${result.summary.minor} |`);
  lines.push(`| **Total** | **${result.summary.total}** |`);
  lines.push('');
  lines.push('## Findings');
  lines.push('');
  if (result.findings.length === 0) {
    lines.push(
      'No findings. This does not mean the page is fully accessible — see the disclaimer below.',
    );
  } else {
    for (const finding of result.findings) {
      lines.push(`### ${finding.severity.toUpperCase()} — ${finding.rule} (${finding.source})`);
      lines.push('');
      lines.push(`- **Message:** ${finding.message}`);
      if (finding.help) lines.push(`- **Help:** ${finding.help}`);
      if (finding.selector) lines.push(`- **Selector:** \`${finding.selector}\``);
      if (finding.snippet) lines.push(`- **Snippet:** \`${finding.snippet.replaceAll('`', "'")}\``);
      lines.push('');
    }
  }
  lines.push('> ' + DISCLAIMER);
  lines.push('');
  return lines.join('\n');
}

export function generateHtml(result: AuditResult): string {
  const rows = result.findings
    .map(
      (finding) => `<tr data-severity="${finding.severity}">
        <td><span class="badge ${finding.severity}">${finding.severity}</span></td>
        <td>${escapeHtml(finding.rule)}</td>
        <td>${escapeHtml(finding.message)}</td>
        <td>${escapeHtml(finding.selector ?? '')}</td>
        <td>${escapeHtml(finding.source)}</td>
      </tr>`,
    )
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BanglaA11y Report — ${escapeHtml(result.target)}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; margin: 0 auto; max-width: 1080px; padding: 1.5rem; color: #111; background: #fff; line-height: 1.5; }
  header { border-bottom: 3px solid #0b6e4f; padding-bottom: 1rem; }
  .cards { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1rem 0; }
  .card { border: 1px solid #ddd; border-radius: 8px; padding: 0.75rem 1rem; min-width: 110px; }
  .card strong { display: block; font-size: 1.5rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; vertical-align: top; }
  th { background: #f2f2f2; }
  .badge { display: inline-block; padding: 0.1rem 0.5rem; border-radius: 999px; color: #fff; font-size: 0.85rem; }
  .badge.critical { background: #b00020; } .badge.serious { background: #c2410c; }
  .badge.moderate { background: #92400e; } .badge.minor { background: #475569; }
  button { margin-right: 0.5rem; padding: 0.4rem 0.8rem; cursor: pointer; }
  .disclaimer { background: #fff7ed; border: 1px solid #fdba74; padding: 1rem; border-radius: 8px; }
  @media (max-width: 700px) { table, thead, tbody, th, td, tr { display: block; } th { display: none; } td { border: none; border-bottom: 1px solid #eee; } }
</style>
</head>
<body>
<header>
  <h1>BanglaA11y Accessibility Report</h1>
  <p><strong>Target:</strong> ${escapeHtml(result.target)}<br>
  <strong>Generated:</strong> ${escapeHtml(result.timestamp)}<br>
  <strong>Engine:</strong> BanglaA11y ${escapeHtml(result.engineVersion)}</p>
</header>
<section class="cards" aria-label="Summary">
  <div class="card"><strong>${result.summary.total}</strong>Total findings</div>
  <div class="card"><strong>${result.summary.critical}</strong>Critical</div>
  <div class="card"><strong>${result.summary.serious}</strong>Serious</div>
  <div class="card"><strong>${result.summary.moderate}</strong>Moderate</div>
  <div class="card"><strong>${result.summary.minor}</strong>Minor</div>
</section>
<p>
  <button type="button" data-filter="all">All</button>
  <button type="button" data-filter="critical">Critical</button>
  <button type="button" data-filter="serious">Serious</button>
  <button type="button" data-filter="moderate">Moderate</button>
  <button type="button" data-filter="minor">Minor</button>
</p>
<table>
  <thead><tr><th>Severity</th><th>Rule</th><th>Message</th><th>Selector</th><th>Source</th></tr></thead>
  <tbody>${rows || `<tr><td colspan="5">No findings.</td></tr>`}</tbody>
</table>
<p class="disclaimer"><strong>Disclaimer:</strong> ${escapeHtml(DISCLAIMER)}</p>
<script>
  document.querySelectorAll('[data-filter]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');
      document.querySelectorAll('tbody tr').forEach(function (row) {
        row.style.display = (filter === 'all' || row.getAttribute('data-severity') === filter) ? '' : 'none';
      });
    });
  });
</script>
</body>
</html>
`;
}
