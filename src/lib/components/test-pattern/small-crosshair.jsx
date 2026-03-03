import { useTestPatternElement } from './test-pattern';

export default function SmallCrosshair({ color = 'white', ...placement }) {
  const { containerStyle, pixelWidth, pixelHeight } = useTestPatternElement(placement);
  const cx = pixelWidth / 2;
  const cy = pixelHeight / 2;

  return (
    <svg style={containerStyle} viewBox={`0 0 ${pixelWidth} ${pixelHeight}`}>
      <line x1={0} y1={cy} x2={pixelWidth} y2={cy} stroke={color} strokeWidth={1} />
      <line x1={cx} y1={0} x2={cx} y2={pixelHeight} stroke={color} strokeWidth={1} />
    </svg>
  );
}
