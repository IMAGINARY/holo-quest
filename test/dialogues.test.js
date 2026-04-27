import { describe, it, expect } from 'vitest';
import Dialogue from '../src/lib/model/dialogues/dialogue';
import DialogueIterator from '../src/lib/model/dialogues/dialogue-iterator';
import TestDialogueIteratorContext from './lib/test-dialogue-iterator-context';
import getDialogueTrace from './lib/get-dialogue-trace';
import helloWorldDialogue from './fixtures/dialogues/core/hello-world.dialogue.json';
import helloThenWorldDialogue from './fixtures/dialogues/core/then.dialogue.json';
import sequenceDialogue from './fixtures/dialogues/sequences/sequence.dialogue.json';
import nestedSequencesDialogue from './fixtures/dialogues/sequences/nested-sequences.dialogue.json';
import sequenceWithSkipDialogue
  from './fixtures/dialogues/sequences/sequence-with-skip.dialogue.json';
import jumpIntoSequenceDialogue
  from './fixtures/dialogues/sequences/jump-into-sequence.dialogue.json';
import jumpToMidSequenceDialogue
  from './fixtures/dialogues/sequences/jump-to-mid-sequence.dialogue.json';
import jumpAroundWithSequencesDialogue
  from './fixtures/dialogues/sequences/jump-around-with-sequences.dialogue.json';
import randomDialogue from './fixtures/dialogues/random/random.dialogue.json';
import cycleDialogue from './fixtures/dialogues/cycle/cycle.dialogue.json';
import monoCycleDialogue from './fixtures/dialogues/cycle/mono-cycle.dialogue.json';
import conditionDialogue from './fixtures/dialogues/conditions/condition.dialogue.json';
import cycleConditionDialogue from './fixtures/dialogues/conditions/cycle-condition.dialogue.json';
import setFlagsDialogue from './fixtures/dialogues/conditions/set-flags.dialogue.json';
import setFlagsIntDialogue from './fixtures/dialogues/conditions/set-flags-int.dialogue.json';
import setFlagsTouchDialogue from './fixtures/dialogues/conditions/set-flags-touch.dialogue.json';
import setFlagsIncDecDialogue
  from './fixtures/dialogues/conditions/set-flags-inc-dec.dialogue.json';
import logicDialogue from './fixtures/dialogues/conditions/logic.dialogue.json';
import comparisonDialogue from './fixtures/dialogues/conditions/comparison.dialogue.json';
import countDialogue from './fixtures/dialogues/conditions/count.dialogue.json';
import firstDialogue from './fixtures/dialogues/first/first-dialogue.json';
import firstWithCondsDialogue from './fixtures/dialogues/first/first-with-conds.json';
import firstBetweenSequencesDialogue from './fixtures/dialogues/first/first-between-sequences.json';
import responseDialogue from './fixtures/dialogues/responses/response.dialogue.json';
import conditionalResponseDialogue
  from './fixtures/dialogues/responses/conditional-response.dialogue.json';
import responseSetsFlagsDialogue
  from './fixtures/dialogues/responses/response-sets-flags.dialogue.json';
import responseFlagDialogue
  from './fixtures/dialogues/responses/response-flag.dialogue.json';
import responseJumpsDialogue from './fixtures/dialogues/responses/response-jumps.dialogue.json';
import thentextResponseDialogue
  from './fixtures/dialogues/responses/thentext-response.dialogue.json';
import helloWorldI18nDialogue from './fixtures/dialogues/i18n/hello-world-i18n.dialogue.json';
import thenTextResponseI18nDialogue
  from './fixtures/dialogues/i18n/thentext-response-i18n.dialogue.json';
import invalidTypeDialogue from './fixtures/dialogues/invalid/invalid-type.dialogue.json';
import invalidThenDialogue from './fixtures/dialogues/invalid/invalid-then.dialogue.json';
import invalidCondDialogue from './fixtures/dialogues/invalid/invalid-cond.dialogue.json';

describe('DialogueIterator', () => {
  describe('core functionality', () => {
    it('should handle a single statement', () => {
      const dialogue = Dialogue.fromJson(helloWorldDialogue);
      const iterator = new DialogueIterator(dialogue, new TestDialogueIteratorContext());
      expect(iterator.getActiveNode().id).to.equal('hello-world');
      expect(iterator.getActiveNode().type).to.equal('root');
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello world!']);
    });

    it('should support resetting', () => {
      const dialogue = Dialogue.fromJson(helloWorldDialogue);
      const iterator = new DialogueIterator(dialogue, new TestDialogueIteratorContext());
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello world!']);
      iterator.reset();
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello world!']);
    });

    it('should handle statements connected by a then', () => {
      const dialogue = Dialogue.fromJson(helloThenWorldDialogue);
      const iterator = new DialogueIterator(dialogue, new TestDialogueIteratorContext());
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello', 'World', '!']);
    });
  });

  describe('sequences', () => {
    it('should handle a sequence', () => {
      const dialogue = Dialogue.fromJson(sequenceDialogue);
      const iterator = new DialogueIterator(dialogue, new TestDialogueIteratorContext());
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello', 'World', '!', 'End']);
    });

    it('should handle nested sequences', () => {
      const dialogue = Dialogue.fromJson(nestedSequencesDialogue);
      const iterator = new DialogueIterator(dialogue, new TestDialogueIteratorContext());
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello', 'World', '!', 'End']);
    });

    it('should handle a sequence that skips midway', () => {
      const dialogue = Dialogue.fromJson(sequenceWithSkipDialogue);
      const iterator = new DialogueIterator(dialogue, new TestDialogueIteratorContext());
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello', 'World', '!', 'End']);
    });

    it('should handle jumping into a sequence', () => {
      const dialogue = Dialogue.fromJson(jumpIntoSequenceDialogue);
      const iterator = new DialogueIterator(dialogue, new TestDialogueIteratorContext());
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello', 'World', '!']);
    });

    it('should handle jumping around with sequences', () => {
      const dialogue = Dialogue.fromJson(jumpAroundWithSequencesDialogue);
      const iterator = new DialogueIterator(dialogue, new TestDialogueIteratorContext());
      expect(getDialogueTrace(iterator)).to.deep.equal(['One', 'Two', 'Three', 'Four', 'Five']);
    });

    it('should handle jumping into the middle of a sequence', () => {
      const dialogue = Dialogue.fromJson(jumpToMidSequenceDialogue);
      const iterator = new DialogueIterator(dialogue, new TestDialogueIteratorContext());
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello', 'World', '!']);
    });
  });

  describe('random', () => {
    it('should handle a random statement', () => {
      const dialogue = Dialogue.fromJson(randomDialogue);
      const context = new TestDialogueIteratorContext();
      context.setRandom([0, 1]);
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello', 'World', '!']);
    });
  });

  describe('cycle', () => {
    it('should handle a cycle statement', () => {
      const dialogue = Dialogue.fromJson(cycleDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello']);
      iterator.reset();
      expect(getDialogueTrace(iterator)).to.deep.equal(['World']);
      iterator.reset();
      expect(getDialogueTrace(iterator)).to.deep.equal(['!']);
      iterator.reset();
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello']);
    });

    it('should handle a cycle statement with a single node', () => {
      const dialogue = Dialogue.fromJson(monoCycleDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello']);
      iterator.reset();
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello']);
      iterator.reset();
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello']);
    });
  });

  describe('conditions', () => {
    it('should skip nodes with unmatched flags', () => {
      const dialogue = Dialogue.fromJson(conditionDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['Neither']);
    });

    it('should enter nodes when flags are set', () => {
      const dialogue = Dialogue.fromJson(conditionDialogue);
      const context = new TestDialogueIteratorContext();
      context.flags.touch('even');
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['Two']);
    });

    it('should use conditions to filter items from sequences', () => {
      const dialogue = Dialogue.fromJson(conditionDialogue);
      const context = new TestDialogueIteratorContext();
      context.flags.touch('useSequence');
      context.flags.touch('possible');
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['A', 'B', 'C']);
    });

    it('should use conditions to filter items from random nodes', () => {
      const dialogue = Dialogue.fromJson(conditionDialogue);
      const context = new TestDialogueIteratorContext();
      context.setRandom([2]);
      context.flags.touch('useRandom');
      context.flags.touch('possible');
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['right']);
    });

    it('should use conditions to filter items from cycle nodes', () => {
      const dialogue = Dialogue.fromJson(cycleConditionDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello']);
      iterator.reset();
      expect(getDialogueTrace(iterator)).to.deep.equal(['World']);
      iterator.reset();
      expect(getDialogueTrace(iterator)).to.deep.equal(['!']);
      iterator.reset();
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello']);
      iterator.reset();
      expect(getDialogueTrace(iterator)).to.deep.equal(['again']);
      iterator.reset();
      expect(getDialogueTrace(iterator)).to.deep.equal(['World']);
    });

    it('should allow a dialogue to set flags', () => {
      const dialogue = Dialogue.fromJson(setFlagsDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['A', 'B']);
      expect(context.flags.exists('aFlag')).to.be.true;
      expect(context.flags.exists('bFlag')).to.be.true;
      expect(context.flags.exists('cFlag')).to.be.false;
    });

    it('should allow a dialogue to set flags to integer literals', () => {
      const dialogue = Dialogue.fromJson(setFlagsIntDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['A', 'B']);
      expect(context.flags.value('aFlag')).to.equal(1);
      expect(context.flags.value('bFlag')).to.equal(2);
      expect(context.flags.value('cFlag')).to.equal(3);
    });

    it('should allow a dialogue to increment or decrement flags', () => {
      const dialogue = Dialogue.fromJson(setFlagsIncDecDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['A', 'B', 'C']);
      expect(context.flags.value('aFlag')).to.equal(1);
      expect(context.flags.value('bFlag')).to.equal(2);
      expect(context.flags.value('cFlag')).to.equal(3);
    });

    it('should not modify a flag if its already set', () => {
      const dialogue = Dialogue.fromJson(setFlagsTouchDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['A', 'B']);
      expect(context.flags.value('aFlag')).to.equal(1);
      expect(context.flags.value('bFlag')).to.equal(2);
    });

    it('should support conditions with logic expressions', () => {
      const dialogue = Dialogue.fromJson(logicDialogue);
      const context = new TestDialogueIteratorContext();
      context.flags.touch('flagA');
      context.flags.touch('flagB');
      context.flags.touch('flagC');
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['A', 'B', 'C']);
    });

    it('should support conditions with comparisons', () => {
      const dialogue = Dialogue.fromJson(comparisonDialogue);
      const context = new TestDialogueIteratorContext();
      context.flags.set('flagA', 2);
      context.flags.set('flagB', 3);
      context.flags.set('flagC', 4);
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['A', 'B', 'C']);
    });

    it('should support conditions with the count function', () => {
      const dialogue = Dialogue.fromJson(countDialogue);
      const context = new TestDialogueIteratorContext();
      context.flags.set('prefixA_flag1', 2);
      context.flags.set('prefixA_flag2', 3);
      context.flags.set('prefixB_flag1', 4);
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['A', 'B', 'C']);
    });
  });

  describe('first', () => {
    it('should support first type nodes', () => {
      const dialogue = Dialogue.fromJson(firstDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello world!']);
    });

    it('should support first type nodes with conditions', () => {
      const dialogue = Dialogue.fromJson(firstWithCondsDialogue);
      const context = new TestDialogueIteratorContext();
      context.flags.touch('flagA');
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello world!']);
    });

    it('should support first type nodes between sequences', () => {
      const dialogue = Dialogue.fromJson(firstBetweenSequencesDialogue);
      const context = new TestDialogueIteratorContext();
      context.flags.touch('flagA');
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator)).to.deep.equal(['Hello', 'world', '!']);
    });
  });

  describe('responses', () => {
    it('should support responses', () => {
      const dialogue = Dialogue.fromJson(responseDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator, [1, 2])).to.deep.equal(
        ['Hello?', '>> Hello world!', 'How are you?', '>> I\'m good, thanks!']
      );
    });

    it('should filter responses using conditions', () => {
      const dialogue = Dialogue.fromJson(conditionalResponseDialogue);
      const context = new TestDialogueIteratorContext();
      context.flags.touch('flagA');
      context.flags.touch('flagB');
      const iterator = new DialogueIterator(dialogue, context);
      iterator.next();
      iterator.getEnabledResponses().map((r) => r.text);
      expect(iterator.getEnabledResponses().map((r) => r.text)).to.deep.equal(
        ['Hello world!', 'Hello everyone!', '...']
      );
    });

    it('should support responses that set flags', () => {
      const dialogue = Dialogue.fromJson(responseSetsFlagsDialogue);
      const context = new TestDialogueIteratorContext();
      expect(context.flags.exists('programmer')).to.be.false;
      expect(context.flags.exists('polite')).to.be.false;
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator, [1])).to.deep.equal(
        ['Hello?', '>> Hello world!']
      );
      expect(context.flags.exists('programmer')).to.be.true;
      expect(context.flags.exists('polite')).to.be.false;
    });

    it('should write the selected response value into the node\'s responseFlag', () => {
      const dialogue = Dialogue.fromJson(responseFlagDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator, [1])).to.deep.equal(
        ['Pick a color', '>> Green']
      );
      expect(context.flags.value('color')).to.equal('green');
    });

    it('should overwrite the responseFlag when a different response is selected', () => {
      const dialogue = Dialogue.fromJson(responseFlagDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator, [2])).to.deep.equal(
        ['Pick a color', '>> Blue']
      );
      expect(context.flags.value('color')).to.equal('blue');
    });

    it('should support responses that jump to other nodes', () => {
      const dialogue = Dialogue.fromJson(responseJumpsDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator, [1])).to.deep.equal(
        ['Hello?', '>> Hello world!', 'I see you\'re a programmer.']
      );
    });

    it('should support responses that generate text when selected', () => {
      const dialogue = Dialogue.fromJson(thentextResponseDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator, [2])).to.deep.equal(
        ['Hello?', '>> Hello world!', 'Are you a programmer?']
      );
    });

    it('should throw an exception if next() is called from a statement with responses', () => {
      const dialogue = Dialogue.fromJson(responseDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      iterator.next();
      expect(() => iterator.next()).to.throw('Can\'t use next() on a node of type \'statement\' with responses');
    });

    it('should throw an exception if nextWithResponse() is called from a statement without responses', () => {
      const dialogue = Dialogue.fromJson(helloWorldDialogue);
      const iterator = new DialogueIterator(dialogue);
      iterator.next();
      expect(() => iterator.nextWithResponse(0)).to.throw('Can\'t use nextWithResponse on a node without responses');
    });

    it('should throw an exception if an invalid response is selected', () => {
      const dialogue = Dialogue.fromJson(responseDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      iterator.next();
      expect(() => iterator.nextWithResponse(3)).to.throw('Unknown response id: 3');
    });
  });

  describe('i18n', () => {
    it('should support texts in multiple languages', () => {
      const dialogue = Dialogue.fromJson(helloWorldI18nDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator, [], 'en')).to.deep.equal(['Hello world!']);
      iterator.reset();
      expect(getDialogueTrace(iterator, [], 'de')).to.deep.equal(['Hallo Welt!']);
    });

    it('should support responses in multiple languages', () => {
      const dialogue = Dialogue.fromJson(thenTextResponseI18nDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getDialogueTrace(iterator, [2], 'en')).to.deep.equal(
        ['Hello?', '>> Hello world!', 'Are you a programmer?']
      );
      iterator.reset();
      expect(getDialogueTrace(iterator, [2], 'de')).to.deep.equal(
        ['Hallo?', '>> Hallo Welt!', 'Bist du ein Programmierer?']
      );
    });
  });

  describe('invalid dialogues', () => {
    it('should throw an exception if a node has an invalid type', () => {
      expect(() => Dialogue.fromJson(invalidTypeDialogue)).to.throw('validation failed');
    });

    it('should throw an exception if a node tries to transition to a non-existant node', () => {
      const dialogue = Dialogue.fromJson(invalidThenDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(() => getDialogueTrace(iterator)).to.throw('Can\'t find node id: non-existant');
    });

    it('should throw an exception if a node has a condition with invalid syntax', () => {
      const dialogue = Dialogue.fromJson(invalidCondDialogue);
      const context = new TestDialogueIteratorContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(() => getDialogueTrace(iterator)).to.throw('Error parsing condition');
    });
  });
});
