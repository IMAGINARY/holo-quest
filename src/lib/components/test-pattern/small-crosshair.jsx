import { useTestPatternElement } from './use-test-pattern-element';

export default function SmallCrosshair({ color = 'white', ...placement }) {
  const centered = {
    ...placement,
    x: (placement.x ?? 0) - (placement.width ?? 100) / 2,
    y: (placement.y ?? 0) - (placement.height ?? 100) / 2,
  };
  const { containerStyle, pixelWidth, pixelHeight } = useTestPatternElement(centered);
  const cx = pixelWidth / 2;
  const cy = pixelHeight / 2;

  return (
    <svg style={containerStyle} viewBox={`0 0 ${pixelWidth} ${pixelHeight}`}>
      <line x1={0} y1={cy} x2={pixelWidth} y2={cy} stroke={color} strokeWidth={1} />
      <line x1={cx} y1={0} x2={cx} y2={pixelHeight} stroke={color} strokeWidth={1} />
    </svg>
  );
}
