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
});
