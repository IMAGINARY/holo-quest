import DialogueSequencerState from './dialogue-sequencer-state';
import DialogueSequencerResponseState from './response-state';

/**
 * UI state that displays a speech bubble for a statement node.
 * Transitions to {@link DialogueSequencerResponseState} if responses are available,
 * otherwise shows a "press to continue" prompt.
 */
export default class DialogueSequencerTextState extends DialogueSequencerState {
  /**
   * @param {DialogueSequencer} dialogueSequencer
   */
  constructor(dialogueSequencer) {
    super(dialogueSequencer);
    this.handleSpeechComplete = this.handleSpeechComplete.bind(this);
  }

  handleSpeechComplete() {
    this.speechDone = true;
    const responses = this.dialogueIterator.getEnabledResponses();
    if (responses && responses.length > 0) {
      this.dialogueSequencer.setUiState(
        new DialogueSequencerResponseState(this.dialogueSequencer)
      );
    } else {
      this.dialogueOverlay.showPressToContinue();
    }
  }

  onBegin() {
    this.speechDone = false;
    this.dialogueOverlay.showSpeech(this.activeNode.text, this.activeNode.class || null);
    this.dialogueOverlay.events.once('speechComplete', this.handleSpeechComplete);
  }

  onAction() {
    if (this.speechDone) {
      this.dialogueOverlay.hideSpeech();
      this.dialogueSequencer.endUi();
    } else {
      this.dialogueOverlay.speedUpSpeech();
    }
  }

  onEnd() {
    this.dialogueOverlay.events.off('speechComplete', this.handleSpeechComplete);
  }
}
