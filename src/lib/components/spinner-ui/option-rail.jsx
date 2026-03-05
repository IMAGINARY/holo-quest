import theme, { lerp, hexLerp } from './theme';

const {
  rail, marker, cursor, label, layout,
} = theme;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function OptionRail({ options, position, velocity }) {
  const keys = Object.keys(options).map(Number).sort((a, b) => a - b);
  const minKey = keys[0];
  const maxKey = keys[keys.length - 1];
  const clampedPos = clamp(position, minKey, maxKey);
  const absVel = Math.min(1, Math.abs(velocity));

  const totalWidth = (maxKey - minKey) * layout.stepWidth + 2 * layout.railPaddingX;
  const keyToX = (key) => layout.railPaddingX + (key - minKey) * layout.stepWidth;
  const cursorX = keyToX(clampedPos);

  const cursorRadius = lerp(cursor.radiusAtRest, cursor.radiusAtMax, absVel);
  const cursorColor = hexLerp(cursor.colorAtRest, cursor.colorAtMax, absVel);

  const railY = layout.height / 2;

  return (
    <div className="relative" style={{ width: totalWidth, height: layout.height }}>
      {/* Rail line */}
      <div
        className="absolute"
        style={{
          left: layout.railPaddingX,
          top: railY - rail.height / 2,
          width: totalWidth - 2 * layout.railPaddingX,
          height: rail.height,
          backgroundColor: rail.color,
        }}
      />

      {/* Center marker (key 0) */}
      <div
        className="absolute rounded-full"
        style={{
          left: keyToX(0) - marker.radius,
          top: railY - marker.radius,
          width: marker.radius * 2,
          height: marker.radius * 2,
          backgroundColor: marker.color,
        }}
      />

      {/* Step markers and labels */}
      {keys.map((key) => {
        const x = keyToX(key);
        const proximity = Math.max(
          0,
          1 - Math.abs(clampedPos - key) / label.proximityRange
        );
        const nearColor = hexLerp(
          label.colorNearMoving,
          label.colorNearResting,
          1 - absVel
        );
        const labelColor = hexLerp(label.colorFar, nearColor, proximity);
        const nearSize = lerp(label.fontSizeMin, label.fontSizeMax, 1 - absVel);
        const fontSize = lerp(label.fontSizeMin, nearSize, proximity);

        return (
          <div key={key}>
            {/* Marker dot */}
            <div
              className="absolute rounded-full"
              style={{
                left: x - marker.radius,
                top: railY - marker.radius,
                width: marker.radius * 2,
                height: marker.radius * 2,
                backgroundColor: marker.color,
              }}
            />
            {/* Label */}
            <div
              className="absolute text-center"
              style={{
                left: x,
                top: railY - label.offsetY,
                transform: 'translateX(-50%)',
                color: labelColor,
                fontSize,
                whiteSpace: 'nowrap',
              }}
            >
              {options[key]}
            </div>
          </div>
        );
      })}

      {/* Cursor */}
      <div
        className="absolute rounded-full"
        style={{
          left: cursorX - cursorRadius,
          top: railY - cursorRadius,
          width: cursorRadius * 2,
          height: cursorRadius * 2,
          backgroundColor: cursorColor,
        }}
      />
    </div>
  );
}
