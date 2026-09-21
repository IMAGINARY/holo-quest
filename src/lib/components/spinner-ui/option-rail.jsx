import ProgressRing from './progress-ring';
import theme, { lerp, hexLerp } from './theme';

const {
  rail, marker, cursor, label, ring, layout,
} = theme;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function OptionRail({
  options, position, velocity, confirmationProgress = 0,
}) {
  const keys = Object.keys(options).map(Number).sort((a, b) => a - b);
  const minKey = keys[0];
  const maxKey = keys[keys.length - 1];
  // Always include 0 in the rendered span: 0 is the implicit neutral
  // marker, so single-sided option sets (e.g. {1: "..."}) must still
  // leave room for it.
  const effectiveMin = Math.min(0, minKey);
  const effectiveMax = Math.max(0, maxKey);
  const clampedPos = clamp(position, effectiveMin, effectiveMax);
  const absVel = Math.min(1, Math.abs(velocity));

  const totalWidth = (effectiveMax - effectiveMin) * layout.stepWidth
    + 2 * layout.railPaddingX;
  const keyToX = (key) => layout.railPaddingX
    + (key - effectiveMin) * layout.stepWidth;
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
        const scale = fontSize / label.fontSizeMin;

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
              className="absolute text-center font-bold"
              style={{
                left: x,
                top: railY - label.offsetY,
                transform: `translateX(-50%) translateY(-100%) scale(${scale})`,
                transformOrigin: 'center bottom',
                color: labelColor,
                fontSize: label.fontSizeMin,
                whiteSpace: 'pre-line',
                minWidth: `${layout.stepWidth * 0.9}px`,
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

      {/* Confirmation ring */}
      {confirmationProgress > 0 && (
        <div
          className="absolute"
          style={{
            left: cursorX - ring.size / 2,
            top: railY - ring.size / 2,
            width: ring.size,
            height: ring.size,
          }}
        >
          <ProgressRing progress={confirmationProgress} color={ring.color} />
        </div>
      )}
    </div>
  );
}

// Control contract (see src/lib/game/ui-controls.js). The rail has no
// placeholder row, so it simply ignores that prop.
OptionRail.placement = 'centered';
