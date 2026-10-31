# Contributing to BanglaA11y

Thank you for considering a contribution. BanglaA11y is a small, practical
toolkit: keep changes focused, tested, and honest about what automated
checks can and cannot prove.

## Getting started

```bash
git clone https://github.com/sakibulhasanmd69-a11y/bangla-a11y.git
cd bangla-a11y
npm install
npx playwright install chromium
npm test
```

## How to contribute

1. Open an issue first for anything larger than a typo, so the design can be
   discussed before code is written.
2. Work on a branch named after the change, e.g. `fix/heading-outline`.
3. Add or update tests for behaviour changes. `npm test` must pass.
4. Run `npm run lint` and `npm run format` before opening a pull request.
5. Write clear commit messages and describe what changed, why, and how you
   tested it in the pull request.

## Rules that matter here

- Never claim automated checks guarantee full WCAG compliance. Keep the
  disclaimer in README and in every report format.
- Never fabricate test results, CI status, or usage numbers. Report what
  actually ran, including failures.
- New checks need a fixture that triggers them and a fixture (or assertion)
  showing they do not fire on a correct page.
- Do not add dependencies lightly. Prefer Node's built-ins and the existing
  Playwright + axe-core stack, and justify anything new in the PR.
- Keep the CLI backward compatible where possible; document breaking
  changes in CHANGELOG.md.

## Code style

- TypeScript strict mode is on; fix type errors rather than suppressing them.
- ESLint and Prettier configurations in the repository root are authoritative.
- Prefer small, readable functions over clever ones, especially in the
  in-page check code in `src/checks.ts` (that function is serialised into
  the audited page and must stay self-contained).

## Questions

Open a GitHub issue with the `question` label. If you are unsure whether
something is a bug or a feature request, open it as a bug and explain what
you expected.
