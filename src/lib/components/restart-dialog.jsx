import { useMemo } from 'react';
import { OptionRail, useSpinnerController } from './spinner-ui';
import { getText } from '../helpers/i18n';

export default function RestartDialog({ config, lang }) {
  const {
    speechTextTopPercent, defaultTextColor, defaultTextSize,
    inputTopPercent, defaultInputColor, defaultInputSize,
  } = config.gameView;

  const question = getText(config.strings.restartDialogQuestion, lang);

  const options = useMemo(
    () => ({
      '-1': getText(config.strings.restartDialogNo, lang),
      1: getText(config.strings.restartDialogYes, lang),
    }),
    [config.strings, lang]
  );

  const { position, velocity, confirmationProgress } = useSpinnerController({
    min: -1,
    max: 1,
    step: 1,
    // eslint-disable-next-line no-console
    onConfirm: (value) => console.log('Restart confirmed:', value),
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
