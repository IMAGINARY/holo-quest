import { useEffect } from 'react';
import useDevStatus from '../stores/dev-status';
import Fade from './fade';

export default function DevStatusBar({ config }) {
  const message = useDevStatus((s) => s.message);
  const seq = useDevStatus((s) => s.seq);
  const clear = useDevStatus((s) => s.clear);

  const {
    textSize, textColor, bgColor, displayDurationMs, fadeDurationMs,
  } = config.gameView.devStatusBar;

  useEffect(() => {
    if (message === null) return undefined;
    const timer = setTimeout(clear, displayDurationMs);
    return () => clearTimeout(timer);
  }, [seq, message, displayDurationMs, clear]);

  return (
    <Fade show={message !== null} duration={fadeDurationMs}>
      <div
        className="absolute bottom-0 left-0 px-3 py-1 whitespace-pre-wrap"
        style={{
          color: textColor,
          backgroundColor: bgColor,
          fontSize: `${textSize}em`,
        }}
      >
        {message}
      </div>
    </Fade>
  );
}
