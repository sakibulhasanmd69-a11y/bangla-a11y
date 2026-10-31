import type { Finding, Severity } from './types.js';

/** The shape returned by the in-page custom checks (source is added by the engine). */
export interface RawFinding {
  help: string;
  id: string;
  message: string;
  rule: string;
  selector: string;
  severity: Severity;
  snippet: string;
}

/**
 * Runs entirely inside the audited page (Playwright serialises this function).
 * It must not reference anything outside its own body.
 *
 * Covers the checks axe-core does not tailor to this toolkit:
 * image alt text, form labels, heading structure, HTML lang vs. content
 * language (including Bengali), RTL layout, basic keyboard accessibility,
 * and a computed colour-contrast spot check (axe-core's color-contrast
 * rule also runs in the engine and is the primary contrast check).
 */
export function runCustomChecks(): RawFinding[] {
  const findings: RawFinding[] = [];

  const selectorOf = (el: Element): string => {
    const parts: string[] = [];
    let current: Element | null = el;
    while (current && parts.length < 3) {
      let part = current.tagName.toLowerCase();
      const id = (current as HTMLElement).id;
      if (id) {
        part += `#${id}`;
      } else {
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(
            (child) => child.tagName === current?.tagName,
          );
          if (siblings.length > 1) {
            part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
          }
        }
      }
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.join(' > ');
  };

  const snippetOf = (el: Element): string => el.outerHTML.slice(0, 200);

  const push = (
    id: string,
    rule: string,
    severity: Severity,
    message: string,
    help: string,
    el: Element,
  ): void => {
    findings.push({
      help,
      id,
      message,
      rule,
      selector: selectorOf(el),
      severity,
      snippet: snippetOf(el),
    });
  };

  // --- Image alt text -------------------------------------------------------
  for (const img of Array.from(document.querySelectorAll('img'))) {
    const alt = img.getAttribute('alt');
    const role = img.getAttribute('role');
    const ariaHidden = img.getAttribute('aria-hidden');
    if (ariaHidden === 'true' || role === 'presentation' || role === 'none') continue;
    if (alt === null) {
      push(
        'img-alt-missing',
        'image-alt',
        'serious',
        'Image has no alt attribute.',
        'Add meaningful alt text, or mark the image as decorative with alt="" and role="presentation".',
        img,
      );
    } else if (alt.trim() === '') {
      const src = img.getAttribute('src') ?? '';
      // An empty alt is legitimate only for a truly decorative image. We
      // cannot prove decorativeness, so only flag empty alt on images that
      // look content-bearing (linked, or with a title).
      if (img.closest('a') !== null || img.getAttribute('title') !== null) {
        push(
          'img-alt-empty',
          'image-alt',
          'moderate',
          'Linked or titled image has empty alt text.',
          'Give the image alt text describing its purpose, not just its appearance.',
          img,
        );
      } else if (src !== '') {
        // Still surface it as minor: authors should confirm it is decorative.
        push(
          'img-alt-empty',
          'image-alt',
          'minor',
          'Image has empty alt text; confirm it is decorative.',
          'If the image conveys information, add alt text. If it is purely decorative, keep alt="".',
          img,
        );
      }
    }
  }

  // --- Form labels ----------------------------------------------------------
  for (const field of Array.from(
    document.querySelectorAll('input, select, textarea'),
  ) as HTMLElement[]) {
    const type = (field as HTMLInputElement).type?.toLowerCase();
    if (
      type === 'hidden' ||
      type === 'submit' ||
      type === 'button' ||
      type === 'reset' ||
      type === 'image'
    )
      continue;
    const id = field.id;
    const hasLabel = id !== '' && document.querySelector(`label[for="${CSS.escape(id)}"]`) !== null;
    const wrapped = field.closest('label') !== null;
    const ariaLabel = field.getAttribute('aria-label');
    const labelledBy = field.getAttribute('aria-labelledby');
    const title = field.getAttribute('title');
    if (
      !hasLabel &&
      !wrapped &&
      !(ariaLabel && ariaLabel.trim() !== '') &&
      !(labelledBy && labelledBy.trim() !== '') &&
      !(title && title.trim() !== '')
    ) {
      push(
        'form-label-missing',
        'form-label',
        'serious',
        'Form control has no associated label.',
        'Associate a <label> with the control, or use aria-label / aria-labelledby.',
        field,
      );
    }
  }

  // --- Heading structure ----------------------------------------------------
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  if (headings.length === 0) {
    push(
      'heading-missing',
      'heading-order',
      'moderate',
      'Page has no headings.',
      'Add at least one h1 describing the page, then a logical heading outline.',
      document.body,
    );
  } else {
    const h1s = headings.filter((h) => h.tagName === 'H1');
    if (h1s.length === 0) {
      push(
        'heading-no-h1',
        'heading-order',
        'moderate',
        'Page has headings but no h1.',
        'Add a single h1 that describes the page topic.',
        headings[0] as Element,
      );
    } else if (h1s.length > 1) {
      for (const extra of h1s.slice(1)) {
        push(
          'heading-multiple-h1',
          'heading-order',
          'minor',
          'Page has more than one h1.',
          'Use one h1 per page and demote the others to h2 or lower.',
          extra,
        );
      }
    }
    let previousLevel = 0;
    for (const heading of headings) {
      const level = Number(heading.tagName.slice(1));
      if (heading.textContent?.trim() === '') {
        push(
          'heading-empty',
          'heading-order',
          'serious',
          'Heading is empty.',
          'Give every heading descriptive text, or remove it.',
          heading,
        );
      }
      if (previousLevel !== 0 && level > previousLevel + 1) {
        push(
          'heading-skipped-level',
          'heading-order',
          'moderate',
          `Heading jumps from h${previousLevel} to h${level}.`,
          'Do not skip heading levels; keep the outline sequential.',
          heading,
        );
      }
      previousLevel = level;
    }
  }

  // --- HTML lang vs. content language ---------------------------------------
  const htmlEl = document.documentElement;
  const lang = htmlEl.getAttribute('lang');
  const bodyText = document.body ? document.body.innerText : '';
  const bengaliCount = (bodyText.match(/[\u0980-\u09FF]/g) ?? []).length;
  const latinCount = (bodyText.match(/[A-Za-z]/g) ?? []).length;
  const rtlCount = (bodyText.match(/[\u0590-\u05FF\u0600-\u06FF]/g) ?? []).length;
  const totalLetters = bengaliCount + latinCount + rtlCount;
  if (lang === null || lang.trim() === '') {
    push(
      'html-lang-missing',
      'html-lang',
      'serious',
      'The <html> element has no lang attribute.',
      'Set lang to the page\'s primary language, e.g. lang="en" or lang="bn".',
      htmlEl,
    );
  } else {
    const primary = lang.trim().toLowerCase().split('-')[0];
    if (totalLetters >= 10) {
      if (bengaliCount / totalLetters > 0.5 && primary !== 'bn') {
        push(
          'html-lang-mismatch-bn',
          'html-lang',
          'serious',
          'Page content is mostly Bengali but html lang is not "bn".',
          'Set html lang="bn" (or bn-BD) so screen readers use Bengali pronunciation.',
          htmlEl,
        );
      } else if (latinCount / totalLetters > 0.8 && primary === 'bn' && bengaliCount < 5) {
        push(
          'html-lang-mismatch-en',
          'html-lang',
          'moderate',
          'Page content is mostly English but html lang is "bn".',
          'Set html lang to match the dominant content language.',
          htmlEl,
        );
      } else if (
        rtlCount / totalLetters > 0.5 &&
        primary !== 'ar' &&
        primary !== 'he' &&
        primary !== 'fa' &&
        primary !== 'ur'
      ) {
        push(
          'html-lang-mismatch-rtl',
          'html-lang',
          'moderate',
          'Page content is mostly RTL-script text but html lang does not match it.',
          'Set html lang to the RTL language of the content.',
          htmlEl,
        );
      }
    }
  }

  // --- RTL layout -----------------------------------------------------------
  const htmlDir = htmlEl.getAttribute('dir');
  if (totalLetters >= 10 && rtlCount / totalLetters > 0.5 && htmlDir !== 'rtl') {
    push(
      'rtl-dir-missing',
      'rtl-layout',
      'moderate',
      'Mostly RTL content but the document has no dir="rtl".',
      'Set dir="rtl" on <html> (or on the RTL content block) so layout mirrors correctly.',
      htmlEl,
    );
  }
  for (const el of Array.from(document.querySelectorAll('[dir]')) as HTMLElement[]) {
    const declared = el.getAttribute('dir');
    const computed = window.getComputedStyle(el).direction;
    if ((declared === 'rtl' && computed !== 'rtl') || (declared === 'ltr' && computed !== 'ltr')) {
      push(
        'rtl-dir-mismatch',
        'rtl-layout',
        'minor',
        `Element declares dir="${declared}" but computes to direction "${computed}".`,
        'Check CSS direction rules overriding the dir attribute.',
        el,
      );
    }
  }

  // --- Basic keyboard accessibility -----------------------------------------
  for (const el of Array.from(document.querySelectorAll('[tabindex]')) as HTMLElement[]) {
    const value = Number(el.getAttribute('tabindex'));
    if (!Number.isNaN(value) && value > 0) {
      push(
        'keyboard-tabindex-positive',
        'keyboard',
        'moderate',
        `Element uses tabindex="${value}"; positive tabindex disrupts natural tab order.`,
        'Use DOM order for tab order and avoid positive tabindex values.',
        el,
      );
    }
  }
  for (const el of Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[]) {
    if (el.getAttribute('href') === null && el.getAttribute('role') !== 'button') {
      push(
        'keyboard-link-no-href',
        'keyboard',
        'minor',
        'Link has no href and is not keyboard-activatable as a link.',
        'Give the link an href, or use a <button> for actions.',
        el,
      );
    }
  }
  for (const el of Array.from(document.querySelectorAll('[onclick]')) as HTMLElement[]) {
    const tag = el.tagName.toLowerCase();
    const isInteractive = ['a', 'button', 'input', 'select', 'textarea'].includes(tag);
    const tabIndex = el.getAttribute('tabindex');
    if (!isInteractive && tabIndex === null && el.getAttribute('role') !== 'button') {
      push(
        'keyboard-clickable-not-focusable',
        'keyboard',
        'serious',
        'Clickable element is not keyboard-focusable.',
        'Use a <button>, or add tabindex="0" and keyboard handling (Enter/Space) plus a role.',
        el,
      );
    }
  }
  const focusable = document.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  if (focusable.length === 0 && document.body && document.body.innerText.trim() !== '') {
    push(
      'keyboard-no-focusable',
      'keyboard',
      'serious',
      'Page has visible content but no keyboard-focusable elements.',
      'Ensure links, buttons and controls are reachable and operable by keyboard.',
      document.body,
    );
  }

  // --- Colour contrast spot check -------------------------------------------
  const parseRgb = (value: string): [number, number, number] | null => {
    const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  };
  const luminance = (rgb: [number, number, number]): number => {
    const linear = rgb.map((channel) => {
      const s = channel / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * (linear[0] ?? 0) + 0.7152 * (linear[1] ?? 0) + 0.0722 * (linear[2] ?? 0);
  };
  const ratio = (a: [number, number, number], b: [number, number, number]): number => {
    const l1 = luminance(a);
    const l2 = luminance(b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  };
  const effectiveBackground = (el: Element): [number, number, number] | null => {
    let current: Element | null = el;
    while (current) {
      const style = window.getComputedStyle(current);
      const bg = style.backgroundColor;
      const parsed = parseRgb(bg);
      if (parsed) {
        const alphaMatch = bg.match(/rgba?\([^)]*,\s*([\d.]+)\s*\)/);
        const alpha = alphaMatch ? Number(alphaMatch[1]) : 1;
        if (alpha === 1) return parsed;
      }
      current = current.parentElement;
    }
    return [255, 255, 255];
  };
  const seen = new Set<Element>();
  for (const el of Array.from(document.querySelectorAll('body *')) as HTMLElement[]) {
    if (seen.has(el)) continue;
    const text = Array.from(el.childNodes).some(
      (node) => node.nodeType === Node.TEXT_NODE && (node.textContent?.trim() ?? '') !== '',
    );
    if (!text) continue;
    seen.add(el);
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    const fg = parseRgb(style.color);
    const bg = effectiveBackground(el);
    if (!fg || !bg) continue;
    const fontSize = Number.parseFloat(style.fontSize);
    const fontWeight = Number(style.fontWeight);
    const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
    const required = isLarge ? 3 : 4.5;
    const actual = ratio(fg, bg);
    if (actual < required) {
      push(
        'color-contrast-low',
        'color-contrast',
        actual < 3 ? 'serious' : 'moderate',
        `Text contrast ratio ${actual.toFixed(2)}:1 is below the ${required}:1 threshold.`,
        'Increase the contrast between text and background to at least 4.5:1 (3:1 for large text).',
        el,
      );
    }
  }

  return findings;
}

export function toFinding(raw: RawFinding): Finding {
  return { ...raw, source: 'bangla-a11y' };
}
