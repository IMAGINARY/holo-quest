import HoloDisplay from './holo-display';
import SpeechText, { Speeds } from './speech-text';
import { OptionRail, useSpinnerController } from './spinner-ui';

const demoLines = [
  { string: 'You think for a while...', speed: Speeds.normal },
  { string: '\n' },
  { string: 'What is your response?', speed: Speeds.normal },
];

const promptOptions = {
  '-1': 'Not for now',
  1: 'Yes, I agree',
};

const promptMin = Math.min(...Object.keys(promptOptions).map(Number));
const promptMax = Math.max(...Object.keys(promptOptions).map(Number));

export default function GameView({ config }) {
  const {
    speechTextTopPercent, defaultTextColor, defaultTextSize,
    promptTopPercent, defaultPromptColor, defaultPromptSize,
  } = config.gameView;

  const {
    position, velocity, confirmationProgress, requestLock,
  } = useSpinnerController({
    min: promptMin,
    max: promptMax,
    step: 1,
    // eslint-disable-next-line no-console
    onConfirm: (value) => console.log('Confirmed:', value),
  });

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <HoloDisplay config={config}>
        <HoloDisplay.Front>
          <div
            className="absolute w-full text-center"
            style={{
              top: `${speechTextTopPercent}%`,
              color: defaultTextColor,
              fontSize: `${defaultTextSize}em`,
            }}
          >
            <SpeechText lines={demoLines} />
          </div>
          <div
            className="absolute w-full flex justify-center"
            style={{
              top: `${promptTopPercent}%`,
              color: defaultPromptColor,
              fontSize: `${defaultPromptSize}em`,
            }}
          >
            <OptionRail
              options={promptOptions}
              position={position}
              velocity={velocity}
              confirmationProgress={confirmationProgress}
            />
          </div>
        </HoloDisplay.Front>
        <HoloDisplay.Back />
      </HoloDisplay>
      <button
        type="button"
        className="absolute inset-0 z-10 cursor-pointer bg-transparent"
        onClick={requestLock}
        aria-label="Activate spinner"
      />
    </div>
  );
}
