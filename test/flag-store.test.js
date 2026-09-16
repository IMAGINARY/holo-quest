import {
  describe, it, expect, beforeEach,
} from 'vitest';
import FlagStore from '../src/lib/model/flag-store';

describe('FlagStore', () => {
  let flags = null;

  beforeEach(() => {
    flags = new FlagStore();
  });

  describe('has', () => {
    it('should distinguish an assigned zero from an unset flag', () => {
      flags.set('score', 0);
      expect(flags.has('score')).to.be.true;
      expect(flags.has('missing')).to.be.false;
    });

    it('should report an assigned empty string', () => {
      flags.set('ending', '');
      expect(flags.has('ending')).to.be.true;
    });
  });

  describe('value', () => {
    it('should return 0 for an unset flag', () => {
      expect(flags.value('missing')).to.equal(0);
    });

    it('should return an assigned empty string rather than 0', () => {
      flags.set('ending', '');
      expect(flags.value('ending')).to.equal('');
    });

    it('should return numbers and strings unchanged', () => {
      flags.set('score', -2.5);
      flags.set('ending', 'evacuated');
      expect(flags.value('score')).to.equal(-2.5);
      expect(flags.value('ending')).to.equal('evacuated');
    });
  });

  describe('exists', () => {
    it('should treat 0 and the empty string as falsy', () => {
      flags.set('zero', 0);
      flags.set('blank', '');
      expect(flags.exists('zero')).to.be.false;
      expect(flags.exists('blank')).to.be.false;
    });

    it('should treat non-empty strings and non-zero numbers as truthy', () => {
      flags.set('ending', 'evacuated');
      flags.set('score', -1);
      expect(flags.exists('ending')).to.be.true;
      expect(flags.exists('score')).to.be.true;
    });
  });

  describe('touch', () => {
    it('should set an unset flag to 1', () => {
      flags.touch('seen');
      expect(flags.value('seen')).to.equal(1);
    });

    it('should leave a truthy flag unchanged', () => {
      flags.set('ending', 'evacuated');
      flags.touch('ending');
      expect(flags.value('ending')).to.equal('evacuated');
    });

    it('should overwrite an empty string, just as it overwrites 0', () => {
      flags.set('blank', '');
      flags.set('zero', 0);
      flags.touch('blank');
      flags.touch('zero');
      expect(flags.value('blank')).to.equal(1);
      expect(flags.value('zero')).to.equal(1);
    });
  });

  describe('inc and dec', () => {
    it('should treat an unset flag as 0', () => {
      flags.inc('score');
      flags.dec('debt', 2);
      expect(flags.value('score')).to.equal(1);
      expect(flags.value('debt')).to.equal(-2);
    });

    it('should throw rather than concatenate onto a string flag', () => {
      flags.set('ending', 'evacuated');
      expect(() => flags.inc('ending')).to.throw(TypeError, 'numeric-only');
      expect(() => flags.dec('ending')).to.throw(TypeError, 'numeric-only');
      expect(flags.value('ending')).to.equal('evacuated');
    });
  });

  describe('the flag event', () => {
    it('should report a previous value of 0 rather than undefined', () => {
      flags.set('score', 0);
      const seen = [];
      flags.events.on('flag', (name, value, oldValue) => seen.push([name, value, oldValue]));
      flags.set('score', 5);
      expect(seen).to.deep.equal([['score', 5, 0]]);
    });

    it('should report undefined for a flag that was never assigned', () => {
      const seen = [];
      flags.events.on('flag', (name, value, oldValue) => seen.push([name, value, oldValue]));
      flags.set('fresh', 1);
      expect(seen).to.deep.equal([['fresh', 1, undefined]]);
    });
  });
});
