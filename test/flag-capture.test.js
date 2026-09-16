import { describe, it, expect } from 'vitest';
import selectCapturedFlags, { flagPatternToRegExp } from '../src/lib/model/dialogues/flag-capture';

const matches = (pattern, name) => flagPatternToRegExp(pattern).test(name);

describe('flagPatternToRegExp', () => {
  describe('literal patterns', () => {
    it('should match the whole flag name', () => {
      expect(matches('ending', 'ending')).to.equal(true);
      expect(matches('ending', 'ending2')).to.equal(false);
      expect(matches('ending', 'pre-ending')).to.equal(false);
    });

    it('should be case sensitive', () => {
      expect(matches('Ending', 'ending')).to.equal(false);
      expect(matches('ending', 'Ending')).to.equal(false);
    });

    it('should treat a dot as a literal, not as any character', () => {
      expect(matches('a.b', 'a.b')).to.equal(true);
      expect(matches('a.b', 'axb')).to.equal(false);
    });

    it('should treat a dash as a literal', () => {
      expect(matches('survey-age', 'survey-age')).to.equal(true);
      expect(matches('survey-age', 'surveyage')).to.equal(false);
    });
  });

  describe("the '*' wildcard", () => {
    it('should match any sequence of characters, including none', () => {
      expect(matches('survey-*', 'survey-age')).to.equal(true);
      expect(matches('survey-*', 'survey-')).to.equal(true);
      expect(matches('survey-*', 'pre-survey-age')).to.equal(false);
    });

    it('should match every name when used alone', () => {
      expect(matches('*', 'ending')).to.equal(true);
      expect(matches('*', 'survey-age')).to.equal(true);
      expect(matches('*', '')).to.equal(true);
    });

    it('should work at the start of a pattern', () => {
      expect(matches('*-age', 'survey-age')).to.equal(true);
      expect(matches('*-age', 'age')).to.equal(false);
    });
  });

  describe("the '?' wildcard", () => {
    it('should match exactly one character', () => {
      expect(matches('q?', 'q1')).to.equal(true);
      expect(matches('q?', 'q10')).to.equal(false);
      expect(matches('q?', 'q')).to.equal(false);
    });

    it('should work at the start of a pattern', () => {
      expect(matches('?nding', 'ending')).to.equal(true);
      expect(matches('?nding', 'nding')).to.equal(false);
    });

    it('should also match a dot', () => {
      expect(matches('a?c', 'a.c')).to.equal(true);
    });
  });

  describe('combined and interior wildcards', () => {
    it("should handle a '*' that is not at the end of the pattern", () => {
      expect(matches('survey-*-count', 'survey-age-count')).to.equal(true);
      expect(matches('survey-*-count', 'survey--count')).to.equal(true);
      expect(matches('survey-*-count', 'survey-a-b-count')).to.equal(true);
      expect(matches('survey-*-count', 'survey-count')).to.equal(false);
      expect(matches('survey-*-count', 'survey-age-count-x')).to.equal(false);
    });

    it("should backtrack so a greedy '*' still matches a repeated suffix", () => {
      expect(matches('survey-*-count', 'survey-a-count-b-count')).to.equal(true);
    });

    it("should handle two '*' wildcards in one pattern", () => {
      expect(matches('survey-*-other-*', 'survey-age-other-1')).to.equal(true);
      expect(matches('survey-*-other-*', 'survey--other-')).to.equal(true);
      expect(matches('survey-*-other-*', 'survey-a-b-other-c-d')).to.equal(true);
      expect(matches('survey-*-other-*', 'survey-age-other')).to.equal(false);
    });

    it("should handle '?' followed by '*'", () => {
      expect(matches('q?-*', 'q1-a')).to.equal(true);
      expect(matches('q?-*', 'q1-')).to.equal(true);
      expect(matches('q?-*', 'q-a')).to.equal(false);
      expect(matches('q?-*', 'q10-a')).to.equal(false);
    });

    it("should handle '*' followed by '?'", () => {
      expect(matches('*-?', 'survey-age-1')).to.equal(true);
      expect(matches('*-?', 'a-b')).to.equal(true);
      expect(matches('*-?', 'ab')).to.equal(false);
    });

    it("should handle an interior '?'", () => {
      expect(matches('survey-?-*', 'survey-a-b')).to.equal(true);
      expect(matches('survey-?-*', 'survey-ab-c')).to.equal(false);
    });

    it('should handle adjacent wildcards', () => {
      expect(matches('**', 'survey-age')).to.equal(true);
      expect(matches('**', '')).to.equal(true);
      expect(matches('?*', 'a')).to.equal(true);
      expect(matches('?*', 'survey-age')).to.equal(true);
      expect(matches('?*', '')).to.equal(false);
    });

    it('should keep a dot literal when combined with a wildcard', () => {
      expect(matches('a.b*', 'a.b')).to.equal(true);
      expect(matches('a.b*', 'a.bc')).to.equal(true);
      expect(matches('a.b*', 'axbc')).to.equal(false);
    });
  });

  it('should return a stateless regexp that can be reused', () => {
    const regExp = flagPatternToRegExp('survey-*');
    expect(regExp.global).to.equal(false);
    expect(regExp.test('survey-age')).to.equal(true);
    expect(regExp.test('survey-age')).to.equal(true);
  });
});

describe('selectCapturedFlags', () => {
  it('should keep only the flags matching a pattern', () => {
    const flags = { 'survey-age': 1, ending: 'bad', other: 2 };
    expect(selectCapturedFlags(['survey-*', 'ending'], flags))
      .to.deep.equal({ 'survey-age': 1, ending: 'bad' });
  });

  it('should return an empty object when nothing matches', () => {
    expect(selectCapturedFlags(['nothing-*'], { ending: 1 })).to.deep.equal({});
  });

  it('should return an empty object for an empty pattern list', () => {
    expect(selectCapturedFlags([], { ending: 1 })).to.deep.equal({});
  });

  it('should return an empty object for an empty flag set', () => {
    expect(selectCapturedFlags(['*'], {})).to.deep.equal({});
  });

  it('should include each flag only once when patterns overlap', () => {
    const result = selectCapturedFlags(['survey-*', 'survey-age'], { 'survey-age': 1 });
    expect(Object.keys(result)).to.deep.equal(['survey-age']);
  });

  it('should include each flag only once when a pattern is repeated', () => {
    const result = selectCapturedFlags(['ending', 'ending'], { ending: 1 });
    expect(Object.keys(result)).to.deep.equal(['ending']);
  });

  it('should keep flags whose value is zero', () => {
    expect(selectCapturedFlags(['q?'], { q1: 0 })).to.deep.equal({ q1: 0 });
  });

  it('should keep string values, as written through responseFlag', () => {
    expect(selectCapturedFlags(['ending'], { ending: 'bad' })).to.deep.equal({ ending: 'bad' });
  });

  it('should keep negative and decimal values', () => {
    const flags = { score: -3, ratio: 0.5 };
    expect(selectCapturedFlags(['*'], flags)).to.deep.equal({ score: -3, ratio: 0.5 });
  });

  it('should return a new object rather than the flag store state', () => {
    const flags = { ending: 1 };
    expect(selectCapturedFlags(['*'], flags)).to.not.equal(flags);
  });

  it('should not mutate the flags it was given', () => {
    const flags = { 'survey-age': 1, other: 2 };
    selectCapturedFlags(['survey-*'], flags);
    expect(flags).to.deep.equal({ 'survey-age': 1, other: 2 });
  });

  it('should return a snapshot that later flag changes do not affect', () => {
    const flags = { 'survey-age': 1 };
    const result = selectCapturedFlags(['survey-*'], flags);
    flags['survey-age'] = 99;
    flags['survey-name'] = 'Ada';
    expect(result).to.deep.equal({ 'survey-age': 1 });
  });
});
