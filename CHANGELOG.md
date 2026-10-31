# Changelog

All notable changes to BanglaA11y are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- CLI `--timeout <ms>` and `--axe-tags <tag,tag>` flags, wired through to
  the Playwright/axe-core engine (previously the engine accepted these
  options but the CLI did not expose them).

### Fixed

- `npm start` now runs the real CLI entry point (`dist/src/bin.js`);
  it previously pointed at a non-existent `dist/cli.js`.

## [0.1.0] - 2026-11-01

### Added

- Initial release of the BanglaA11y auditing toolkit.
- CLI (`bangla-a11y audit <url-or-html-file>`) with HTML, JSON, and Markdown
  reports and a `--strict` mode.
- Playwright + axe-core auditing engine with WCAG 2.x A/AA rule tags.
- Custom checks: image alt text, form labels, heading structure, colour
  contrast spot check, HTML `lang` vs. content language (Bengali/English),
  RTL layout, and basic keyboard accessibility.
- Bengali content detection (Unicode U+0980–U+09FF) and lang-mismatch checks.
- Responsive, filterable HTML report; JSON and Markdown reports.
- GitHub Actions CI workflow (install, build, lint, test).
- Unit, engine, and CLI integration tests with local HTML fixtures.
- README, CONTRIBUTING, Code of Conduct, Security Policy, MIT LICENSE,
  issue templates, and roadmap.
- Disclaimer in README and every report: automated checks do not guarantee
  full WCAG compliance.
