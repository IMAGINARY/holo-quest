import HoloDisplay from './holo-display';
import SpeechText, { Speeds } from './speech-text';
import { OptionRail, useSpinnerController } from './spinner-ui';

const demoSegments = [
  { string: 'You think for a while...\nWhat is your response?', speed: Speeds.normal },
];

const inputOptions = {
  '-1': 'Not for now',
  1: 'Yes, I agree',
};

const inputMin = Math.min(...Object.keys(inputOptions).map(Number));
const inputMax = Math.max(...Object.keys(inputOptions).map(Number));

export default function GameView({ config }) {
  const {
    speechTextTopPercent, defaultTextColor, defaultTextSize,
    inputTopPercent, defaultInputColor, defaultInputSize,
  } = config.gameView;

  const {
    position, velocity, confirmationProgress, requestLock,
  } = useSpinnerController({
    min: inputMin,
    max: inputMax,
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
            <SpeechText segments={demoSegments} />
          </div>
          <div
            className="absolute w-full flex justify-center"
            style={{
              top: `${inputTopPercent}%`,
              color: defaultInputColor,
              fontSize: `${defaultInputSize}em`,
            }}
          >
            <OptionRail
              options={inputOptions}
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
