import EventEmitter from 'eventemitter3';
import DialogueIterator from './dialogue-iterator';
import DialogueSequencerTextState from './dialogue-sequencer-states/text-state';
import DialogueSequencerEffectState from './dialogue-sequencer-states/effect-state';

/**
 * Drives dialogue playback by iterating through the dialogue tree and
 * delegating presentation to UI states (text, effect, response).
 *
 * Emits 'end' when the dialogue finishes and 'terminate' when forcibly stopped.
 */
export default class DialogueSequencer {
  /**
   * @param {DialogueEffectFactory} dialogueEffectFactory
   * @param {Object} uiController - UI controller that renders speech, responses, and effects.
   */
  constructor(dialogueEffectFactory, uiController) {
    this.dialogueEffectFactory = dialogueEffectFactory;
    this.uiController = uiController;
    this.dialogue = null;
    this.dialogueIterator = null;
    this.uiState = null;
    /** @type {Object<string, DialogueEffect>} Active effects keyed by effect type. */
    this.activeEffects = {};

    this.events = new EventEmitter();

    this.uiController.events.on('textShown', () => this.handleTextShown());
    this.uiController.events.on('input', (value) => this.handleInput(value));
  }

  /**
   * Transitions to a new UI state, calling lifecycle hooks on both old and new states.
   *
   * @param {DialogueSequencerState|null} state
   */
  setUiState(state) {
    if (this.uiState) {
      this.uiState.onEnd();
    }
    this.uiState = state;
    if (this.uiState) {
      this.uiState.onBegin();
    }
  }

  /**
   * Ends the current UI state and advances the dialogue iterator.
   *
   * @param {string|null} [responseId=null] - If provided, advances via the chosen response.
   */
  endUi(responseId = null) {
    this.uiState = null;
    if (responseId !== null) {
      this.dialogueIterator.nextWithResponse(responseId);
    } else {
      this.dialogueIterator.next();
    }
    this.runUntilInteractivity();
  }

  /**
   * Starts playing a dialogue.
   *
   * @param {Dialogue} dialogue
   * @param {DialogueIteratorContext} context
   */
  play(dialogue, context) {
    this.dialogue = dialogue;
    this.dialogueIterator = new DialogueIterator(dialogue, context);
    this.runUntilInteractivity();
  }

  /**
   * Advances the dialogue iterator, skipping non-interactive nodes, until a
   * statement/effect node is reached or the dialogue ends.
   *
   * @private
   */
  runUntilInteractivity() {
    const { dialogueIterator } = this;

    if (!this.handledByUI(dialogueIterator.getActiveNode())) {
      do {
        dialogueIterator.next();
      } while (!dialogueIterator.isEnd() && !this.handledByUI(dialogueIterator.getActiveNode()));
    }

    if (this.handledByUI(dialogueIterator.getActiveNode())) {
      const nodeType = dialogueIterator.getActiveNode().type;
      if (nodeType === 'statement') {
        this.setUiState(new DialogueSequencerTextState(this));
      } else if (nodeType === 'effect') {
        this.setUiState(new DialogueSequencerEffectState(this));
      }
    } else {
      this.onDialogueEnd();
    }
  }

  /** @private */
  onDialogueEnd() {
    this.events.emit('end');
    this.terminate();
  }

  /**
   * Forwards an input value to the current UI state.
   *
   * @param {any} value
   */
  handleInput(value) {
    if (this.uiState) {
      this.uiState.onInput(value);
    }
  }

  /**
   * Forwards a textShown event to the current UI state.
   */
  handleTextShown() {
    if (this.uiState) {
      this.uiState.onTextShown();
    }
  }

  /**
   * Returns true if the node requires UI interaction (statement or effect).
   *
   * @private
   * @param {Object|null} node
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  handledByUI(node) {
    return node && (node.type === 'statement' || node.type === 'effect');
  }

  /**
   * Creates and tracks a new dialogue effect, terminating any existing effect of the same type.
   *
   * @param {string} effectType
   * @param {Object} effectOptions
   * @returns {DialogueEffect}
   */
  createEffect(effectType, effectOptions) {
    this.terminateEffect(effectType);
    this.activeEffects[effectType] = this.dialogueEffectFactory
      .createEffect(effectType, effectOptions);
    return this.activeEffects[effectType];
  }

  /**
   * Ends an active effect gracefully, calling the callback when done.
   *
   * @param {string} effectType
   * @param {function} endDoneCallback
   */
  endActiveEffect(effectType, endDoneCallback) {
    if (this.activeEffects[effectType]) {
      this.activeEffects[effectType].end(endDoneCallback);
    } else {
      endDoneCallback();
    }
  }

  /**
   * Immediately terminates and removes a tracked effect.
   *
   * @param {string} effectType
   */
  terminateEffect(effectType) {
    if (this.activeEffects[effectType]) {
      this.activeEffects[effectType].terminate();
    }
    delete this.activeEffects[effectType];
  }

  /**
   * Immediately terminates all tracked effects.
   */
  terminateAllEffects() {
    Object.keys(this.activeEffects).forEach((effectType) => {
      this.activeEffects[effectType].terminate();
    });
    this.activeEffects = {};
  }

  /**
   * Developer-mode: jump to the next statement node in JSON document order.
   *
   * Bypasses narrative branching entirely. Does NOT apply flag assignments,
   * cycle updates, or effect side effects. Resuming narrative playback after
   * a preview jump yields inconsistent state — restart the game to recover.
   *
   * No-op if no dialogue is active or already at the last statement.
   */
  previewNextStatement() {
    this.previewStatement(+1);
  }

  /**
   * Developer-mode: jump to the previous statement node in JSON document order.
   * See {@link previewNextStatement} for caveats.
   */
  previewPrevStatement() {
    this.previewStatement(-1);
  }

  /**
   * @private
   * @param {number} direction +1 for next statement, -1 for previous.
   */
  previewStatement(direction) {
    if (!this.dialogue || !this.dialogueIterator) return;

    const { statementNodes } = this.dialogue;
    if (statementNodes.length === 0) return;

    const current = this.dialogueIterator.getActiveNode();
    const currentIndex = current ? statementNodes.indexOf(current) : -1;

    let targetIndex;
    if (currentIndex === -1) {
      targetIndex = direction > 0 ? 0 : statementNodes.length - 1;
    } else {
      targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= statementNodes.length) return;
    }

    // UI cleanup normally happens inside state.onInput() via clearScreen().
    // Replacing the state directly skips that, so do it here.
    this.uiController.clearScreen();
    this.terminateAllEffects();
    this.setUiState(null);

    this.dialogueIterator.jumpTo(statementNodes[targetIndex]);
    this.setUiState(new DialogueSequencerTextState(this));
  }

  /**
   * Forcibly stops the dialogue, terminating all effects and clearing state.
   * Emits 'terminate'.
   */
  terminate() {
    this.terminateAllEffects();
    this.setUiState(null);
    this.dialogueIterator = null;
    this.dialogue = null;
    this.events.emit('terminate');
  }
}
