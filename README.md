# BanglaA11y

**BanglaA11y** is an open-source accessibility auditing toolkit for Bengali and English websites.
It runs a real browser (Playwright), runs [axe-core](https://github.com/dequelabs/axe-core) WCAG
rules, and adds custom checks tuned for Bengali content, RTL layout, and keyboard use — then
writes responsive HTML, JSON, and Markdown reports.

> **Important disclaimer:** Automated checks do **not** guarantee full WCAG compliance.
> Manual testing with assistive technology (screen readers, keyboard-only navigation,
> magnification) is still required before claiming a site is accessible.

## Features

- Working CLI: `bangla-a11y audit <url-or-html-file>`
- Reusable auditing engine (`src/engine.ts`, exported from `src/index.ts`)
- Playwright browser testing + axe-core WCAG 2.x A/AA rules
- Custom checks:
  - Missing or empty image alt text
  - Form labels (label, `aria-label`, `aria-labelledby`)
  - Heading structure (missing/skipped/empty/multiple h1)
  - Colour contrast (axe-core rule + computed-ratio spot check)
  - HTML `lang` attribute, including Bengali content detection (Unicode U+0980–U+09FF)
  - Bengali and English language support, including lang/content mismatch
  - RTL layout issues (missing `dir="rtl"`, dir/computed-direction mismatch)
  - Basic keyboard accessibility (positive tabindex, links without href,
    clickable non-focusable elements, no focusable elements)
- HTML (responsive, filterable), JSON, and Markdown reports
- TypeScript strict mode, ESLint, Prettier
- Unit + integration tests (Node's built-in test runner)
- GitHub Actions CI (install, build, lint, test)

## Installation

Requires Node.js 18 or newer.

```bash
# From source (until the package is published to npm, which it is not yet)
git clone https://github.com/sakibulhasanmd69-a11y/bangla-a11y.git
cd bangla-a11y
npm install
npm run build

# Optional: use the CLI globally from this checkout
npm link
```

Playwright downloads a Chromium browser on first use:

```bash
npx playwright install chromium
```

## Usage

```bash
# Audit a live site, write all three report formats
bangla-a11y audit https://example.com --out ./bangla-a11y-report

# Audit a local HTML file, JSON only
bangla-a11y audit ./fixtures/bad.html --format json --out ./out

# Audit a local file, Markdown only
bangla-a11y audit ./fixtures/bengali.html --format markdown --out ./out

# Exit 1 if any critical or serious finding is reported (useful in CI)
bangla-a11y audit https://example.com --strict

# Override the page timeout and the axe-core tag set
bangla-a11y audit https://example.com --timeout 15000 --axe-tags wcag2a,wcag2aa
```

The CLI prints a summary and the paths it wrote:

```text
Target: ./fixtures/bad.html
Findings: 34 total (0 critical, 12 serious, 18 moderate, 4 minor)
Wrote ./bangla-a11y-report/report.html
Wrote ./bangla-a11y-report/report.json
Wrote ./bangla-a11y-report/report.md
```

(Counts above are illustrative — real counts depend on the page audited.)

### Library use

```ts
import { auditTarget } from 'bangla-a11y';

const result = await auditTarget('https://example.com');
console.log(result.summary);
for (const finding of result.findings) {
  console.log(finding.severity, finding.rule, finding.message);
}
```

## Reports

- `report.html` — responsive, filterable by severity; no external assets.
- `report.json` — machine-readable, includes the disclaimer and the full finding list.
- `report.md` — human-readable summary + findings, suitable for pasting into an issue.

Every report carries the disclaimer that automated checks do not guarantee full
WCAG compliance.

## Checks in detail

| Area       | What is checked                                                        | Engine           |
| ---------- | ---------------------------------------------------------------------- | ---------------- |
| Images     | Missing alt, empty alt on linked/titled images                         | BanglaA11y       |
| Forms      | Controls without label / aria-label / aria-labelledby                  | BanglaA11y + axe |
| Headings   | Missing h1, multiple h1, skipped levels, empty headings                | BanglaA11y + axe |
| Contrast   | WCAG contrast rules + computed ratio spot check (4.5:1, 3:1 large)     | axe + BanglaA11y |
| Language   | Missing/invalid `lang`, Bengali content vs. `lang`, English vs. `lang` | BanglaA11y       |
| RTL        | Missing `dir="rtl"` for RTL-majority content, dir/computed mismatch    | BanglaA11y       |
| Keyboard   | Positive tabindex, href-less links, clickable non-focusable elements   | BanglaA11y + axe |
| WCAG rules | axe-core tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`               | axe-core         |

## Development

```bash
npm install
npm run build      # TypeScript -> dist/
npm run lint       # ESLint
npm test           # build + Node test runner (unit, engine, CLI integration)
npm run format     # Prettier
```

Tests live in `test/` and fixtures in `fixtures/`:

- `fixtures/good.html` — passes the basic custom checks.
- `fixtures/bad.html` — missing alt/labels, skipped headings, missing lang, low contrast, keyboard issues.
- `fixtures/bengali.html` — Bengali content correctly declared `lang="bn"`.
- `fixtures/bengali-mismatch.html` — Bengali content incorrectly declared `lang="en"`.
- `fixtures/rtl.html` — RTL content without `dir="rtl"`.

## Roadmap

See [ROADMAP.md](ROADMAP.md). Highlights: more Bengali-specific rules (font
readability, transliteration checks), sitemap crawling, baseline/diff reports,
SARIF output for GitHub code scanning, and a hosted demo report.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please read the
[Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Security

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT — see [LICENSE](LICENSE).
