import { getText } from '../helpers/i18n';

export default function RestartDialog({ config, lang }) {
  const { speechTextTopPercent, defaultTextColor, defaultTextSize } = config.gameView;
  const question = getText(config.strings.restartDialogQuestion, lang);

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
    </div>
  );
}
