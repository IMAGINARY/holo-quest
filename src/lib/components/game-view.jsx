import { useMemo } from 'react';
import HoloDisplay from './holo-display';
import SpeechText, { Speeds } from './speech-text';
import { OptionRail, useSpinnerController } from './spinner-ui';
import useGameState from '../stores/game-state';
import { getText } from '../helpers/i18n';

export default function GameView({ config }) {
  const { text, input, lang } = useGameState();

  const {
    speechTextTopPercent, defaultTextColor, defaultTextSize,
    inputTopPercent, defaultInputColor, defaultInputSize,
  } = config.gameView;

  // getText() dereferences text[lang] when text is an object; guard null first
  // since typeof null === 'object' would trip it.
  const resolvedText = useMemo(
    () => (text === null ? null : getText(text, lang)),
    [text, lang]
  );

  const segments = useMemo(
    () => (resolvedText !== null ? [{ string: resolvedText, speed: Speeds.normal }] : null),
    [resolvedText]
  );

  const resolvedOptions = useMemo(
    () => (input === null
      ? null
      : Object.fromEntries(
        Object.entries(input.options).map(([k, v]) => [k, getText(v, lang)])
      )),
    [input, lang]
  );

  const inputKeys = input !== null ? Object.keys(input.options).map(Number) : [];
  const inputMin = inputKeys.length > 0 ? Math.min(...inputKeys) : 0;
  const inputMax = inputKeys.length > 0 ? Math.max(...inputKeys) : 0;

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
          {resolvedText !== null && (
            <div
              className="absolute w-full text-center"
              style={{
                top: `${speechTextTopPercent}%`,
                color: defaultTextColor,
                fontSize: `${defaultTextSize}em`,
              }}
            >
              <SpeechText segments={segments} />
            </div>
          )}
          {input !== null && (
            <div
              className="absolute w-full flex justify-center"
              style={{
                top: `${inputTopPercent}%`,
                color: defaultInputColor,
                fontSize: `${defaultInputSize}em`,
              }}
            >
              <OptionRail
                options={resolvedOptions}
                position={position}
                velocity={velocity}
                confirmationProgress={confirmationProgress}
              />
            </div>
          )}
        </HoloDisplay.Front>
        <HoloDisplay.Back />
      </HoloDisplay>
      {input !== null && (
        <button
          type="button"
          className="absolute inset-0 z-10 cursor-pointer bg-transparent"
          onClick={requestLock}
          aria-label="Activate spinner"
        />
      )}
    </div>
  );
}
