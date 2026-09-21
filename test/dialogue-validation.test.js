import { describe, it, expect } from 'vitest';
import Dialogue from '../src/lib/model/dialogues/dialogue';
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
import invalidResponseFlagWithoutValuesDialogue
  from './fixtures/dialogues/invalid/invalid-response-flag-without-values.dialogue.json';
import invalidResponseFlagNoResponsesDialogue
  from './fixtures/dialogues/invalid/invalid-response-flag-no-responses.dialogue.json';
import invalidResponseFlagIdDialogue
  from './fixtures/dialogues/invalid/invalid-response-flag-id.dialogue.json';
import invalidResponseValueMixedTypesDialogue
  from './fixtures/dialogues/invalid/invalid-response-value-mixed-types.dialogue.json';
import invalidResponseFlagTypeConflictDialogue
  from './fixtures/dialogues/invalid/invalid-response-flag-type-conflict.dialogue.json';
import responseFlagNumberDialogue
  from './fixtures/dialogues/responses/response-flag-number.dialogue.json';
import responseWithValuesDialogue
  from './fixtures/dialogues/responses/response-with-values.dialogue.json';
import responseFlagDialogue
  from './fixtures/dialogues/responses/response-flag.dialogue.json';
import invalidResponsePositionPartialDialogue
  from './fixtures/dialogues/invalid/invalid-response-position-partial.dialogue.json';
import invalidResponsePositionDuplicateDialogue
  from './fixtures/dialogues/invalid/invalid-response-position-duplicate.dialogue.json';
import invalidResponsePositionZeroDialogue
  from './fixtures/dialogues/invalid/invalid-response-position-zero.dialogue.json';
import invalidResponsePositionGapDialogue
  from './fixtures/dialogues/invalid/invalid-response-position-gap.dialogue.json';
import responsePositionsDialogue
  from './fixtures/dialogues/responses/response-positions.dialogue.json';
import invalidResponseControlNoResponsesDialogue
  from './fixtures/dialogues/invalid/invalid-response-control-no-responses.dialogue.json';
import invalidResponsePlaceholderNoResponsesDialogue
  from './fixtures/dialogues/invalid/invalid-response-placeholder-no-responses.dialogue.json';
import invalidResponseControlIdDialogue
  from './fixtures/dialogues/invalid/invalid-response-control-id.dialogue.json';
import responseControlDialogue
  from './fixtures/dialogues/responses/response-control.dialogue.json';
import invalidCaptureCondDialogue
  from './fixtures/dialogues/invalid/invalid-capture-cond.dialogue.json';
import captureDialogue from './fixtures/dialogues/core/capture.dialogue.json';

// Structural validation runs at the end of Dialogue.fromJson, after the schema layer,
// so an invalid dialogue throws at construction rather than needing a separate pass.
describe('Dialogue validation', () => {
  describe('ids', () => {
    it('should detect duplicate ids', () => {
      expect(() => Dialogue.fromJson(duplicateIdDialogue))
        .to.throw('Dialogue contains duplicate node id');
    });

    it('should detect invalid references to other nodes', () => {
      expect(() => Dialogue.fromJson(invalidReferenceDialogue))
        .to.throw('Dialogue contains invalid reference');
    });
  });

  describe('cycles', () => {
    it('should detect cycles through \'then\' properties', () => {
      expect(() => Dialogue.fromJson(cycleThenDialogue)).to.throw('Dialogue contains a cycle');
    });

    it('should detect cycles through \'then\' properties in responses', () => {
      expect(() => Dialogue.fromJson(cycleResponseDialogue)).to.throw('Dialogue contains a cycle');
    });

    it('should detect cycles through sibling nodes in sequences', () => {
      expect(() => Dialogue.fromJson(cycleSequenceDialogue)).to.throw('Dialogue contains a cycle');
    });

    it('should detect cycles if a node redirects to itself', () => {
      expect(() => Dialogue.fromJson(cycleSelfDialogue)).to.throw('Dialogue contains a cycle');
    });

    it('should detect cycles if a node redirects to itself from a response', () => {
      expect(() => Dialogue.fromJson(cycleResponseSelfDialogue))
        .to.throw('Dialogue contains a cycle');
    });

    it('should not detect cycles from sibling nodes with a parent that is not a sequence', () => {
      expect(() => Dialogue.fromJson(cycleRandomDialogue)).to.not.throw();
    });
  });

  describe('response values', () => {
    it('should detect responses where some have values and others do not', () => {
      expect(() => Dialogue.fromJson(invalidResponseValuePartialDialogue))
        .to.throw('inconsistent values');
    });

    it('should detect duplicate response values within a set', () => {
      expect(() => Dialogue.fromJson(invalidResponseValueDuplicateDialogue))
        .to.throw("duplicate response value 'same'");
    });

    // Was a schema failure until the value `anyOf` collapsed; `checkResponseValues`
    // now reports it, naming the node.
    it('should reject a response set that mixes value types', () => {
      expect(() => Dialogue.fromJson(invalidResponseValueMixedTypesDialogue))
        .to.throw('mix number and string values');
    });

    it('should accept responses where all have unique values', () => {
      expect(() => Dialogue.fromJson(responseWithValuesDialogue)).to.not.throw();
    });
  });

  describe('response positions', () => {
    it('should detect responses where some have positions and others do not', () => {
      expect(() => Dialogue.fromJson(invalidResponsePositionPartialDialogue))
        .to.throw('inconsistent positions');
    });

    it('should detect duplicate response positions within a set', () => {
      expect(() => Dialogue.fromJson(invalidResponsePositionDuplicateDialogue))
        .to.throw('duplicate response position 1');
    });

    // 0 is where the spinner rests and it never confirms there, so an option
    // placed at 0 could never be selected.
    it('should reject a response placed at position 0', () => {
      expect(() => Dialogue.fromJson(invalidResponsePositionZeroDialogue))
        .to.throw('position 0');
    });

    // A gap is a settleable slot with no response behind it.
    it('should reject non-contiguous response positions', () => {
      expect(() => Dialogue.fromJson(invalidResponsePositionGapDialogue))
        .to.throw('non-contiguous response positions');
    });

    it('should accept a contiguous set that skips the neutral position', () => {
      expect(() => Dialogue.fromJson(responsePositionsDialogue)).to.not.throw();
    });
  });

  describe('responseFlag', () => {
    it('should reject a responseFlag that is not a valid flag id', () => {
      expect(() => Dialogue.fromJson(invalidResponseFlagIdDialogue)).to.throw('validation failed');
    });

    // These were schema failures until the `responseFlag` if/then block moved out of
    // specs/dialogue.schema.json; `checkResponseFlag` now reports them, naming the node.
    it('should detect a responseFlag on a node where some responses are missing values', () => {
      expect(() => Dialogue.fromJson(invalidResponseFlagWithoutValuesDialogue))
        .to.throw('responses are missing values');
    });

    it('should detect a responseFlag on a node with no responses', () => {
      expect(() => Dialogue.fromJson(invalidResponseFlagNoResponsesDialogue))
        .to.throw('has responseFlag but no responses');
    });

    it('should detect two nodes writing different value types to the same responseFlag', () => {
      // Asserted without naming a node: `dialogue.nodes` is not in document order,
      // so either node may be the one reported as conflicting.
      expect(() => Dialogue.fromJson(invalidResponseFlagTypeConflictDialogue))
        .to.throw("responseFlag 'mood'");
    });

    it('should accept a responseFlag when all responses have unique values', () => {
      expect(() => Dialogue.fromJson(responseFlagDialogue)).to.not.throw();
    });

    it('should accept a responseFlag whose responses all have numeric values', () => {
      expect(() => Dialogue.fromJson(responseFlagNumberDialogue)).to.not.throw();
    });
  });

  // The control id is only checked against the registered controls at runtime
  // (see test/ui-controls.test.js); here it is just a well-formed identifier.
  describe('response control', () => {
    it('should reject a responseControl that is not a valid identifier', () => {
      expect(() => Dialogue.fromJson(invalidResponseControlIdDialogue))
        .to.throw('validation failed');
    });

    it('should detect a responseControl on a node with no responses', () => {
      expect(() => Dialogue.fromJson(invalidResponseControlNoResponsesDialogue))
        .to.throw('has responseControl but no responses');
    });

    it('should detect a responsePlaceholder on a node with no responses', () => {
      expect(() => Dialogue.fromJson(invalidResponsePlaceholderNoResponsesDialogue))
        .to.throw('has responsePlaceholder but no responses');
    });

    it('should accept a responseControl with a string or translated responsePlaceholder', () => {
      expect(() => Dialogue.fromJson(responseControlDialogue)).to.not.throw();
    });
  });

  describe('capture', () => {
    it('should detect a capture condition that cannot be parsed', () => {
      expect(() => Dialogue.fromJson(invalidCaptureCondDialogue))
        .to.throw('invalid capture condition');
    });

    it('should accept a valid capture condition', () => {
      expect(() => Dialogue.fromJson(captureDialogue)).to.not.throw();
    });
  });
});
