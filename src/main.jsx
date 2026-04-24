import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import initStandaloneApp from './lib/init/init-standalone-app';
import SoundManager from './lib/sound/sound-manager';
// import AppView from './lib/components/app-view';
import GameView from './lib/components/game-view';
import useGameState from './lib/stores/game-state';

const { config } = await initStandaloneApp();
// eslint-disable-next-line no-console
console.log('Ready.');

if (window.IMAGINARY === undefined) {
  window.IMAGINARY = {};
}
if (window.IMAGINARY.HoloQuest === undefined) {
  window.IMAGINARY.HoloQuest = {};
}
window.IMAGINARY.HoloQuest.soundManager = new SoundManager(config);

const appNode = document.getElementById('app');
const root = createRoot(appNode);
root.render(<StrictMode><GameView config={config} /></StrictMode>);

// Temporary: seed store with demo data for development
useGameState.getState().setText('You think for a while...\nWhat is your response?');
useGameState.getState().setInput({
  type: 'default',
  options: {
    '-1': { en: 'Not for now', es: 'Ahora no' },
    1: { en: 'Yes, I agree', es: 'Sí, estoy de acuerdo' },
  },
});
