import DialogueSequencerState from './dialogue-sequencer-state';
import DialogueSequencerResponseState from './response-state';

/**
 * UI state that displays a speech bubble for a statement node.
 * Transitions to {@link DialogueSequencerResponseState} if responses are available,
 * otherwise shows a "press to continue" prompt.
 */
export default class DialogueSequencerTextState extends DialogueSequencerState {
  onBegin() {
    this.uiController.showText(this.activeNode.text);
  }

  onTextShown() {
    const responses = this.dialogueIterator.getEnabledResponses();
    if (responses && responses.length > 0) {
      this.dialogueSequencer.setUiState(
        new DialogueSequencerResponseState(this.dialogueSequencer)
      );
    } else {
      this.uiController.showContinueInput();
    }
  }

  onInput() {
    this.uiController.clearScreen();
    this.dialogueSequencer.endUi();
  }
}
