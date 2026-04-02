import { useTestPatternElement } from './use-test-pattern-element';

export default function ColorSwatches({ colors = [], ...placement }) {
  const { containerStyle, pixelWidth, pixelHeight } = useTestPatternElement(placement);

  if (colors.length === 0) return null;

  const swatchWidth = pixelWidth / colors.length;

  return (
    <svg style={containerStyle} viewBox={`0 0 ${pixelWidth} ${pixelHeight}`}>
      {colors.map((fill, i) => (
        <rect
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          x={swatchWidth * i}
          y={0}
          width={swatchWidth}
          height={pixelHeight}
          fill={fill}
        />
      ))}
    </svg>
  );
}
