import { useMemo } from 'react';
import { OptionRail, useSpinnerController } from './spinner-ui';
import { getText } from '../helpers/i18n';

const CANCEL = -1;
const CONFIRM = 1;

export default function RestartDialog({ config, lang, controller }) {
  const {
    speechTextTopPercent, defaultTextColor, defaultTextSize,
    inputTopPercent, defaultInputColor, defaultInputSize,
  } = config.gameView;

  const question = getText(config.strings.restartDialogQuestion, lang);

  const options = useMemo(
    () => ({
      [CANCEL]: getText(config.strings.restartDialogCancel, lang),
      [CONFIRM]: getText(config.strings.restartDialogConfirm, lang),
    }),
    [config.strings, lang]
  );

  const { position, velocity, confirmationProgress } = useSpinnerController({
    min: CANCEL,
    max: CONFIRM,
    step: 1,
    onConfirm: (value) => {
      controller.hideRestartDialog();
      if (value === CONFIRM) controller.startGame();
    },
  });

  return (
    <div className="absolute inset-0 bg-red-950/85 backdrop-blur-[14px]">
      <div
        className="absolute w-full text-center"
        style={{
          top: `${speechTextTopPercent}%`,
          color: defaultTextColor,
          fontSize: `${defaultTextSize}em`,
        }}
      >
        {question}
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
          options={options}
          position={position}
          velocity={velocity}
          confirmationProgress={confirmationProgress}
        />
      </div>
    </div>
  );
}
