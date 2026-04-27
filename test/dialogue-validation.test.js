import { describe, it, expect } from 'vitest';
import Dialogue from '../src/lib/model/dialogues/dialogue';
import validateDialogue from '../src/lib/model/dialogues/dialogue-validation';
import cycleThenDialogue from './fixtures/dialogues/invalid/invalid-cycle-then.dialogue.json';
import cycleResponseDialogue
  from './fixtures/dialogues/invalid/invalid-cycle-response.dialogue.json';
import cycleSequenceDialogue
  from './fixtures/dialogues/invalid/invalid-cycle-sequence.dialogue.json';
import cycleSelfDialogue from './fixtures/dialogues/invalid/invalid-cycle-self.dialogue.json';
import cycleResponseSelfDialogue
  from './fixtures/dialogues/invalid/invalid-cycle-response-self.dialogue.json';
import cycleRandomDialogue from './fixtures/dialogues/invalid/invalid-cycle-random.dialogue.json';
import duplicateIdDialogue from './fixtures/dialogues/invalid/invalid-duplicate-id.dialogue.json';
import invalidReferenceDialogue from './fixtures/dialogues/invalid/invalid-reference.dialogue.json';
import invalidResponseValuePartialDialogue
  from './fixtures/dialogues/invalid/invalid-response-value-partial.dialogue.json';
import invalidResponseValueDuplicateDialogue
  from './fixtures/dialogues/invalid/invalid-response-value-duplicate.dialogue.json';
import responseWithValuesDialogue
  from './fixtures/dialogues/responses/response-with-values.dialogue.json';

describe('Dialogue validation', () => {
  describe('ids', () => {
    it('should detect duplicate ids', () => {
      const dialogue = Dialogue.fromJson(duplicateIdDialogue);
      expect(() => validateDialogue(dialogue)).to.throw('Dialogue contains duplicate node id');
    });

    it('should detect invalid references to other nodes', () => {
      const dialogue = Dialogue.fromJson(invalidReferenceDialogue);
      expect(() => validateDialogue(dialogue)).to.throw('Dialogue contains invalid reference');
    });
  });

  describe('cycles', () => {
    it('should detect cycles through \'then\' properties', () => {
      const dialogue = Dialogue.fromJson(cycleThenDialogue);
      expect(() => validateDialogue(dialogue)).to.throw('Dialogue contains a cycle');
    });

    it('should detect cycles through \'then\' properties in responses', () => {
      const dialogue = Dialogue.fromJson(cycleResponseDialogue);
      expect(() => validateDialogue(dialogue)).to.throw('Dialogue contains a cycle');
    });

    it('should detect cycles through sibling nodes in sequences', () => {
      const dialogue = Dialogue.fromJson(cycleSequenceDialogue);
      expect(() => validateDialogue(dialogue)).to.throw('Dialogue contains a cycle');
    });

    it('should detect cycles if a node redirects to itself', () => {
      const dialogue = Dialogue.fromJson(cycleSelfDialogue);
      expect(() => validateDialogue(dialogue)).to.throw('Dialogue contains a cycle');
    });

    it('should detect cycles if a node redirects to itself from a response', () => {
      const dialogue = Dialogue.fromJson(cycleResponseSelfDialogue);
      expect(() => validateDialogue(dialogue)).to.throw('Dialogue contains a cycle');
    });

    it('should not detect cycles from sibling nodes with a parent that is not a sequence', () => {
      const dialogue = Dialogue.fromJson(cycleRandomDialogue);
      expect(() => validateDialogue(dialogue)).to.not.throw();
    });
  });

  describe('response values', () => {
    it('should detect responses where some have values and others do not', () => {
      const dialogue = Dialogue.fromJson(invalidResponseValuePartialDialogue);
      expect(() => validateDialogue(dialogue)).to.throw('inconsistent values');
    });

    it('should detect duplicate response values within a set', () => {
      const dialogue = Dialogue.fromJson(invalidResponseValueDuplicateDialogue);
      expect(() => validateDialogue(dialogue)).to.throw("duplicate response value 'same'");
    });

    it('should accept responses where all have unique values', () => {
      const dialogue = Dialogue.fromJson(responseWithValuesDialogue);
      expect(() => validateDialogue(dialogue)).to.not.throw();
    });
  });
});
