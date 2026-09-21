import DialogueSequencerState from './dialogue-sequencer-state';
import DialogueSequencerThenTextState from './then-state';

/**
 * UI state that displays selectable response options and processes the player's choice.
 */
export default class DialogueSequencerResponseState extends DialogueSequencerState {
  /**
   * @param {DialogueSequencer} dialogueSequencer
   */
  constructor(dialogueSequencer) {
    super(dialogueSequencer);
    this.responses = this.dialogueIterator.getEnabledResponses();
  }

  onBegin() {
    this.uiController.showInput(this.responses, {
      control: this.activeNode.responseControl,
      placeholder: this.activeNode.responsePlaceholder,
    });
  }

  onInput(responseId) {
    const selectedResponse = this.dialogueIterator.getResponse(responseId);
    this.uiController.clearScreen();
    if (selectedResponse.thenText) {
      this.dialogueSequencer.setUiState(
        new DialogueSequencerThenTextState(this.dialogueSequencer, responseId)
      );
    } else {
      this.dialogueSequencer.endUi(responseId);
    }
  }
}
