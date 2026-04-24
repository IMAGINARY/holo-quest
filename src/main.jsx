import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import initStandaloneApp from './lib/init/init-standalone-app';
import SoundManager from './lib/sound/sound-manager';
import GameView from './lib/components/game-view';
import GameController from './lib/game/game-controller';
import useGameState from './lib/stores/game-state';

const { config, story } = await initStandaloneApp();
// eslint-disable-next-line no-console
console.log('Ready.');

if (window.IMAGINARY === undefined) {
  window.IMAGINARY = {};
}
if (window.IMAGINARY.HoloQuest === undefined) {
  window.IMAGINARY.HoloQuest = {};
}
window.IMAGINARY.HoloQuest.soundManager = new SoundManager(config);

const controller = new GameController(config);
controller.setStory(story);

const appNode = document.getElementById('app');
const root = createRoot(appNode);
root.render(<StrictMode><GameView config={config} controller={controller} /></StrictMode>);

// Temporary: seed store with demo data for development
useGameState.getState().setText({
  en: 'You think for a while...\nWhat is your response?',
  de: 'Du denkst eine Weile nach...\nWas ist deine Antwort?',
});
useGameState.getState().setInput({
  type: 'default',
  options: {
    '-1': { en: 'Not for now', de: 'Nicht jetzt' },
    1: { en: 'Yes, I agree', de: 'Ja, ich stimme zu' },
  },
});
