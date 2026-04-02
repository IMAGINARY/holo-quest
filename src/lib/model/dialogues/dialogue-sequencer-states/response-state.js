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
    this.dialogueOverlay.showResponseOptions(
      Object.fromEntries(this.responses.map(
        (response) => [response.id, [response.text, response.class || null]]
      ))
    );
  }

  onAction() {
    this.dialogueOverlay.hideResponseOptions();
    this.dialogueOverlay.hideSpeech();
    const responseId = this.dialogueOverlay.getSelectedResponseId();
    const selectedResponse = this.dialogueIterator.getResponse(responseId);
    if (selectedResponse.thenText) {
      this.dialogueSequencer.setUiState(
        new DialogueSequencerThenTextState(this.dialogueSequencer, responseId)
      );
    } else {
      this.dialogueSequencer.endUi(responseId);
    }
  }
}
