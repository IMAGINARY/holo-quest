import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import HoloDisplay from './holo-display';
import SpeechText, { Speeds } from './speech-text';
import { useSpinnerController, usePointerLock } from './spinner-ui';
import RestartDialog from './restart-dialog';
import DevStatusBar from './dev-status-bar';
import Fade from './fade';
import useGameState from '../stores/game-state';
import { getText } from '../helpers/i18n';

// Lags `path` so a swap between two non-null images fully fades the old
// image to black before mounting the new one. Returns the path that should
// currently be rendered and whether it should be visible.
function useFadingBackground(path, duration) {
  const [displayedPath, setDisplayedPath] = useState(path);
  const [show, setShow] = useState(path !== null);

  useEffect(() => {
    if (path === displayedPath) return undefined;
    if (displayedPath === null) {
      setDisplayedPath(path);
      setShow(true);
      return undefined;
    }
    setShow(false);
    const timer = setTimeout(() => {
      setDisplayedPath(path);
      setShow(path !== null);
    }, duration);
    return () => clearTimeout(timer);
  }, [path, displayedPath, duration]);

  return { displayedPath, show };
}

export default function GameView({ config, controller }) {
  const {
    text, textVersion, input, backgroundPath, lang, restartDialogVisible,
  } = useGameState();

  const {
    speechTextTopPercent, defaultTextColor, defaultTextSize,
    inputTopPercent, defaultInputColor, defaultInputSize,
    background,
  } = config.gameView;

  const { displayedPath: displayedBackgroundPath, show: showBackground } = useFadingBackground(
    backgroundPath,
    background.fadeDurationMs
  );

  // getText() dereferences text[lang] when text is an object; guard null first
  // since typeof null === 'object' would trip it.
  const resolvedText = useMemo(
    () => (text === null ? null : getText(text, lang)),
    [text, lang]
  );

  const segments = useMemo(
    () => (resolvedText !== null ? [{ string: resolvedText, speed: Speeds.fast }] : null),
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

  // Drives SpeechText remount on every `setText` call but not on lang swap.
  // SpeechText preserves reveal progress across segment changes, so passing
  // the same key during a translation swap keeps that progress. `textVersion`
  // bumps on every `setText`, including re-shows of the same node reference
  // (which happens when restart lands the new game on the same slide that
  // was already displayed) — keying on it forces a fresh reveal in those
  // cases too, where comparing `text` identity would not.
  const textKey = text === null ? null : textVersion;

  const resolvedOptions = useMemo(
    () => (input === null
      ? null
      : Object.fromEntries(
        Object.entries(input.options).map(([k, v]) => [k, getText(v, lang)])
      )),
    [input, lang]
  );

  // Same null guard as `resolvedText`. An omitted placeholder is an empty
  // label: controls that show one still render, just with nothing in it.
  const resolvedPlaceholder = useMemo(
    () => (input?.placeholder == null ? '' : getText(input.placeholder, lang) ?? ''),
    [input, lang]
  );

  // The registered control selected by the statement's `responseControl`.
  // `GameController.validateStory` guarantees every referenced control exists.
  const Control = input === null ? null : controller.uiControls.get(input.type);

  const inputKeys = input !== null ? Object.keys(input.options).map(Number) : [];
  const inputMin = inputKeys.length > 0 ? Math.min(...inputKeys) : 0;
  const inputMax = inputKeys.length > 0 ? Math.max(...inputKeys) : 0;

  const { requestLock } = usePointerLock();

  const {
    position, velocity, confirmationProgress,
  } = useSpinnerController({
    ...config.spinner,
    enabled: !restartDialogVisible,
    min: inputMin,
    max: inputMax,
    step: 1,
    gearRatio: Control?.gearRatio ?? 1,
    // eslint-disable-next-line no-console
    onConfirm: handleInput,
  });

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-[Averia_Sans_Libre]">
      <HoloDisplay config={config}>
        <HoloDisplay.Front>
          {resolvedText !== null && (
            <div
              className="absolute w-[90%] ml-[5%] text-center"
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
          <Fade show={input !== null} duration={350}>
            <div
              className="absolute w-full flex justify-center"
              style={{
                top: `${inputTopPercent}%`,
                // Puts the control's anchor line (see `anchorTop` in
                // ui-controls.js) at `inputTopPercent` instead of its top edge.
                marginTop: -(Control?.anchorTop ?? 0),
                color: defaultInputColor,
                fontSize: `${defaultInputSize}em`,
              }}
            >
              {Control && (
                <Control
                  options={resolvedOptions}
                  placeholder={resolvedPlaceholder}
                  position={position}
                  velocity={velocity}
                  confirmationProgress={confirmationProgress}
                />
              )}
            </div>
          </Fade>
          {restartDialogVisible && (
            <RestartDialog config={config} lang={lang} controller={controller} />
          )}
          <DevStatusBar config={config} />
        </HoloDisplay.Front>
        <HoloDisplay.Back>
          <Fade show={showBackground} duration={background.fadeDurationMs}>
            {displayedBackgroundPath !== null && (
              <img
                src={displayedBackgroundPath}
                alt=""
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
          </Fade>
        </HoloDisplay.Back>
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
