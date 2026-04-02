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
    this.handleSpeechComplete = this.handleSpeechComplete.bind(this);
  }

  onBegin() {
    this.speechDone = false;
    const response = this.dialogueIterator.getResponse(this.responseId);
    this.dialogueOverlay.showSpeech(response.thenText, response.thenClass || null);
    this.dialogueOverlay.events.once('speechComplete', this.handleSpeechComplete);
  }

  handleSpeechComplete() {
    this.speechDone = true;
    this.dialogueOverlay.showPressToContinue();
  }

  onAction() {
    if (this.speechDone) {
      this.dialogueOverlay.hideSpeech();
      this.dialogueSequencer.endUi(this.responseId);
    } else {
      this.dialogueOverlay.speedUpSpeech();
    }
  }

  onEnd() {
    this.dialogueOverlay.events.off('speechComplete', this.handleSpeechComplete);
  }
}
