/* eslint-disable class-methods-use-this */

/**
 * Base class for dialogue sequencer UI states.
 *
 * Subclasses implement the lifecycle hooks {@link onBegin}, {@link onInput}, {@link onTextShown},
 * and {@link onEnd} to control what happens when a state is entered, the player presses
 * the action button, and the state exits.
 */
export default class DialogueSequencerState {
  /**
   * @param {DialogueSequencer} dialogueSequencer
   */
  constructor(dialogueSequencer) {
    this.dialogueSequencer = dialogueSequencer;
    this.uiController = dialogueSequencer.uiController;
    this.dialogueIterator = dialogueSequencer.dialogueIterator;
    this.activeNode = this.dialogueIterator ? this.dialogueIterator.getActiveNode() : null;
  }

  /** Called when this state becomes active. */
  onBegin() {

  }

  /** Called when the text for the active node is shown. */
  onTextShown() {

  }

  /** Called when the player selects an option from an input control. */
  // eslint-disable-next-line no-unused-vars
  onInput(value) {

  }

  /** Called when this state is being replaced or cleared. */
  onEnd() {

  }
}
