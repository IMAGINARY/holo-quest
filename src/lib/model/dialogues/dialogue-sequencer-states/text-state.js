import DialogueSequencerState from './dialogue-sequencer-state';
import DialogueSequencerResponseState from './response-state';

export default class DialogueSequencerTextState extends DialogueSequencerState {
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
