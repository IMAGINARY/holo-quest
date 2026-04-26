import { useCallback, useMemo } from 'react';
import HoloDisplay from './holo-display';
import SpeechText, { Speeds } from './speech-text';
import { OptionRail, useSpinnerController, usePointerLock } from './spinner-ui';
import RestartDialog from './restart-dialog';
import useGameState from '../stores/game-state';
import { getText } from '../helpers/i18n';

export default function GameView({ config, controller }) {
  const {
    text, input, lang, restartDialogVisible,
  } = useGameState();

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

  const handleSpeechComplete = useCallback(
    () => controller.gameUiController.handleTextShown(),
    [controller]
  );

  const handleInput = useCallback(
    (value) => {
      controller.gameUiController.handleInput(value);
    },
    [controller]
  );

  // Drives SpeechText remount on narrative-text change but not on lang swap:
  // SpeechText preserves reveal progress across segment changes, so passing
  // the same key during a translation swap keeps that progress; a new `text`
  // produces a new key, forcing a fresh reveal.
  const textKey = useMemo(
    () => (text === null ? null : JSON.stringify(text)),
    [text]
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

  const { requestLock } = usePointerLock();

  const {
    position, velocity, confirmationProgress,
  } = useSpinnerController({
    enabled: !restartDialogVisible,
    min: inputMin,
    max: inputMax,
    step: 1,
    // eslint-disable-next-line no-console
    onConfirm: handleInput,
  });

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-[Averia_Sans_Libre]">
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
              <SpeechText
                key={textKey}
                segments={segments}
                onComplete={handleSpeechComplete}
              />
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
          {restartDialogVisible && (
            <RestartDialog config={config} lang={lang} controller={controller} />
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
