export { auditHtml, auditTarget, ENGINE_VERSION } from './engine.js';
export { detectContentLanguage, isKnownLang, normaliseLang } from './language.js';
export { generateHtml, generateJson, generateMarkdown, DISCLAIMER } from './reports.js';
export type {
  AuditOptions,
  AuditResult,
  AuditSummary,
  ContentLanguage,
  Finding,
  FindingSource,
  Severity,
} from './types.js';
