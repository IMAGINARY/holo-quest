import HoloDisplay from './holo-display';
import SpeechText, { Speeds } from './speech-text';

const demoLines = [
  { string: 'You think for a while...', speed: Speeds.normal },
  { string: '\n' },
  { string: 'What is your response?', speed: Speeds.normal },
];

export default function GameView({ config }) {
  const { speechTextTopPercent, defaultTextColor, defaultTextSize } = config.gameView;

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
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
        </HoloDisplay.Front>
        <HoloDisplay.Back />
      </HoloDisplay>
    </div>
  );
}
