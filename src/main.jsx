import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import initStandaloneApp from './lib/init/init-standalone-app';
import initNachbarin from './lib/init/init-nachbarin';
import registerDialogueEffects from './lib/init/register-dialogue-effects';
import registerUiControls from './lib/init/register-ui-controls';
import GameView from './lib/components/game-view';
import GameController from './lib/game/game-controller';
import Dialogue from './lib/model/dialogues/dialogue';

const { config, story, storyText } = await initStandaloneApp();
registerDialogueEffects();
const uiControls = registerUiControls();
// eslint-disable-next-line no-console
console.log('Ready.');

const parsedStory = Dialogue.fromJson(story);
const nachbarin = await initNachbarin(config, storyText);
const controller = new GameController(config, uiControls, nachbarin);
controller.setStory(parsedStory);

const appNode = document.getElementById('app');
const root = createRoot(appNode);
root.render(<StrictMode><GameView config={config} controller={controller} /></StrictMode>);

controller.startGame();
