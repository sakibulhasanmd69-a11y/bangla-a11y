# BanglaA11y Roadmap

This roadmap is aspirational, not a promise. Items move to CHANGELOG.md only
when they actually ship.

## v0.2 — Deeper Bengali support (next)

- [ ] Bengali font-readability guidance (font size/line height for Bengali script)
- [ ] Checks for Bengali alt text / labels matching page language
- [ ] More RTL cases: mixed-direction paragraphs, `bdi`/`bdo` misuse
- [x] CLI: `--axe-tags` passthrough and `--timeout` flag wiring to the engine (shipped; see CHANGELOG Unreleased)

## v0.3 — Workflow integration

- [ ] Sitemap crawling (audit many pages in one run, one combined report)
- [ ] Baseline reports and diff output (new vs. fixed findings between runs)
- [ ] SARIF output for GitHub code scanning
- [ ] `--fail-on` severity threshold (finer than today's `--strict`)

## v0.4 — Reports and reach

- [ ] Per-page trend history from saved JSON reports
- [ ] Bengali-language report output (`--lang bn`)
- [ ] Example report site (generated from the fixtures, clearly labelled as such)

## Later / only if there is demand

- [ ] Watch mode for local development
- [ ] Figma/design-token contrast checks (out of scope for a page auditor today)
- [ ] npm publication — only after a stable 1.0 API and a maintainer review

## Explicitly out of scope

- Claiming WCAG conformance from automated results alone.
- Auditing sites without permission (see SECURITY.md).
- Replacing manual testing with assistive technology.
