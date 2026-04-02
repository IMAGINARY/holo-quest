import { createContext, useContext } from 'react';

export const TestPatternContext = createContext(null);

export function useTestPatternElement({
  x = 0, y = 0, width = 100, height = 100,
} = {}) {
  const { width: parentWidth, height: parentHeight } = useContext(TestPatternContext);

  const containerStyle = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    width: `${width}%`,
    height: `${height}%`,
  };

  const pixelWidth = Math.round((width / 100) * parentWidth);
  const pixelHeight = Math.round((height / 100) * parentHeight);

  return { containerStyle, pixelWidth, pixelHeight };
}
