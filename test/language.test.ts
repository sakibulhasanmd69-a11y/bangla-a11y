import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { detectContentLanguage, isKnownLang, normaliseLang } from '../src/language.js';

describe('detectContentLanguage', () => {
  it('detects Bengali', () => {
    assert.equal(detectContentLanguage('আমার বাংলা ওয়েবসাইটে স্বাগতম, এটি বাংলা লেখা।'), 'bn');
  });
  it('detects English', () => {
    assert.equal(
      detectContentLanguage('Welcome to my English website, this is English text.'),
      'en',
    );
  });
  it('detects mixed Bengali and English', () => {
    assert.equal(
      detectContentLanguage('Hello world, this is English. আমার বাংলা লেখা এখানে আছে।'),
      'mixed',
    );
  });
  it('returns unknown for almost no text', () => {
    assert.equal(detectContentLanguage('Hi'), 'unknown');
  });
});

describe('lang helpers', () => {
  it('normalises bn-BD to bn', () => {
    assert.equal(normaliseLang('bn-BD'), 'bn');
    assert.equal(isKnownLang('bn-BD'), true);
    assert.equal(isKnownLang('xx'), false);
    assert.equal(normaliseLang(null), null);
  });
});
