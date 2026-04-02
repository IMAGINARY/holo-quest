import { useTestPatternElement } from './use-test-pattern-element';

export default function ActiveArea({ color = 'white', ...placement }) {
  const { containerStyle, pixelWidth, pixelHeight } = useTestPatternElement(placement);

  const shorter = Math.min(pixelWidth, pixelHeight);
  const cornerLen = Math.round(shorter * 0.05);
  const tickLen = Math.round(shorter * 0.02);

  const inset = 0;
  const left = inset;
  const top = inset;
  const right = pixelWidth - inset;
  const bottom = pixelHeight - inset;
  const midX = pixelWidth / 2;
  const midY = pixelHeight / 2;

  return (
    <svg style={containerStyle} viewBox={`0 0 ${pixelWidth} ${pixelHeight}`}>
      {/* Border */}
      <rect
        x={left}
        y={top}
        width={right - left}
        height={bottom - top}
        fill="none"
        stroke={color}
        strokeWidth={1}
      />

      {/* Corner L-marks */}
      {/* Top-left */}
      <line x1={left} y1={top + cornerLen} x2={left} y2={top} stroke={color} strokeWidth={2} />
      <line x1={left} y1={top} x2={left + cornerLen} y2={top} stroke={color} strokeWidth={2} />
      {/* Top-right */}
      <line x1={right - cornerLen} y1={top} x2={right} y2={top} stroke={color} strokeWidth={2} />
      <line x1={right} y1={top} x2={right} y2={top + cornerLen} stroke={color} strokeWidth={2} />
      {/* Bottom-left */}
      <line
        x1={left}
        y1={bottom - cornerLen}
        x2={left}
        y2={bottom}
        stroke={color}
        strokeWidth={2}
      />
      <line
        x1={left}
        y1={bottom}
        x2={left + cornerLen}
        y2={bottom}
        stroke={color}
        strokeWidth={2}
      />
      {/* Bottom-right */}
      <line
        x1={right - cornerLen}
        y1={bottom}
        x2={right}
        y2={bottom}
        stroke={color}
        strokeWidth={2}
      />
      <line
        x1={right}
        y1={bottom - cornerLen}
        x2={right}
        y2={bottom}
        stroke={color}
        strokeWidth={2}
      />

      {/* Edge midpoint ticks */}
      {/* Top */}
      <line x1={midX} y1={top} x2={midX} y2={top + tickLen} stroke={color} strokeWidth={2} />
      {/* Bottom */}
      <line x1={midX} y1={bottom} x2={midX} y2={bottom - tickLen} stroke={color} strokeWidth={2} />
      {/* Left */}
      <line x1={left} y1={midY} x2={left + tickLen} y2={midY} stroke={color} strokeWidth={2} />
      {/* Right */}
      <line x1={right} y1={midY} x2={right - tickLen} y2={midY} stroke={color} strokeWidth={2} />
    </svg>
  );
}
