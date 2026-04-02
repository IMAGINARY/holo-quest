import { useTestPatternElement } from './use-test-pattern-element';

export default function DiagonalCrosshair({ color = 'white', ...placement }) {
  const { containerStyle, pixelWidth, pixelHeight } = useTestPatternElement(placement);

  return (
    <svg style={containerStyle} viewBox={`0 0 ${pixelWidth} ${pixelHeight}`}>
      <line x1={0} y1={0} x2={pixelWidth} y2={pixelHeight} stroke={color} strokeWidth={1} />
      <line x1={pixelWidth} y1={0} x2={0} y2={pixelHeight} stroke={color} strokeWidth={1} />
    </svg>
  );
}
