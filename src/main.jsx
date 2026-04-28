import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import initStandaloneApp from './lib/init/init-standalone-app';
import SoundManager from './lib/sound/sound-manager';
import GameView from './lib/components/game-view';
import GameController from './lib/game/game-controller';
import safeBuildDialogueFromItems from './lib/model/dialogues/dialogue-safe-builder';

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

const parsedStory = safeBuildDialogueFromItems(story.id, story.items);
const controller = new GameController(config);
controller.setStory(parsedStory);

const appNode = document.getElementById('app');
const root = createRoot(appNode);
root.render(<StrictMode><GameView config={config} controller={controller} /></StrictMode>);

controller.startGame();
