import DialogueEffectFactory from '../model/dialogues/effects/dialogue-effect-factory';
import BgImageEffect from '../model/dialogues/effects/bg-image-effect';
import SoundEffect from '../model/dialogues/effects/sound-effect';

/**
 * Register all dialogue-effect classes with the static factory registry.
 *
 * Must be called once during app startup, before any dialogue starts playing.
 */
export default function registerDialogueEffects() {
  DialogueEffectFactory.registerEffect('bg_image', BgImageEffect);
  DialogueEffectFactory.registerEffect('sound', SoundEffect);
}
