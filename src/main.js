import initStandaloneApp from './lib/init/init-standalone-app';
import SoundManager from './lib/sound/sound-manager';

// eslint-disable-next-line no-unused-vars
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
