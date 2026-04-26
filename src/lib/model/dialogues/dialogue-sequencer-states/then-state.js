import DialogueSequencerState from './dialogue-sequencer-state';

/**
 * UI state that displays the follow-up text (`thenText`) after a response is selected,
 * before advancing the dialogue with that response.
 */
export default class DialogueSequencerThenTextState extends DialogueSequencerState {
  /**
   * @param {DialogueSequencer} dialogueSequencer
   * @param {string} responseId - The id of the response whose thenText is shown.
   */
  constructor(dialogueSequencer, responseId) {
    super(dialogueSequencer);
    this.responseId = responseId;
  }

  onBegin() {
    const response = this.dialogueIterator.getResponse(this.responseId);
    this.uiController.showText(response.thenText);
  }

  onTextShown() {
    this.uiController.showContinueInput();
  }

  onInput() {
    this.uiController.clearScreen();
    this.dialogueSequencer.endUi(this.responseId);
  }
}
