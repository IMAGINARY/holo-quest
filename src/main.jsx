import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import initStandaloneApp from './lib/init/init-standalone-app';
import registerDialogueEffects from './lib/init/register-dialogue-effects';
import GameView from './lib/components/game-view';
import GameController from './lib/game/game-controller';
import safeBuildDialogue from './lib/model/dialogues/dialogue-safe-builder';

const { config, story } = await initStandaloneApp();
registerDialogueEffects();
// eslint-disable-next-line no-console
console.log('Ready.');

const parsedStory = safeBuildDialogue(story);
const controller = new GameController(config);
controller.setStory(parsedStory);

const appNode = document.getElementById('app');
const root = createRoot(appNode);
root.render(<StrictMode><GameView config={config} controller={controller} /></StrictMode>);

controller.startGame();
