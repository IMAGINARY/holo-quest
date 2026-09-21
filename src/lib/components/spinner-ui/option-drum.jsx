import ProgressRing from './progress-ring';
import theme, { hexLerp } from './theme';

const {
  width, visibleAround, label, frame, fade, ring,
} = theme.drum;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function OptionDrum({
  options, placeholder = '', position, velocity, confirmationProgress = 0,
}) {
  // `options` maps spinner position to label, like every control. The drum
  // is 'sequential', so its keys are 1..n. Row index = spinner position: 0 is
  // the neutral placeholder row, and the option at position p sits on row p.
  const labels = Object.entries(options)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, text]) => text);
  const rows = [placeholder, ...labels];
  const clampedPos = clamp(position, 0, labels.length);
  const absVel = Math.min(1, Math.abs(velocity));

  const rowHeight = label.fontSize * label.lineHeight;
  const viewportHeight = (2 * visibleAround + 1) * rowHeight;
  const centerTop = visibleAround * rowHeight;

  // The gradient straddles the clip edge: it starts half its height outside
  // the viewport, so at rest the outer half of the outermost rows is faded.
  const fadeHalf = (fade.height ?? rowHeight) / 2;
  const maskImage = 'linear-gradient(to bottom, '
    + `transparent ${-fadeHalf}px, black ${fadeHalf}px, `
    + `black calc(100% - ${fadeHalf}px), transparent calc(100% + ${fadeHalf}px))`;

  const frameStyle = {
    height: frame.height,
    fontSize: label.fontSize,
    backgroundImage: `linear-gradient(to right, transparent, ${frame.color} ${frame.fadeWidth}, `
      + `${frame.color} calc(100% - ${frame.fadeWidth}), transparent)`,
  };

  const nearColor = hexLerp(
    label.colorNearMoving,
    label.colorNearResting,
    1 - absVel
  );

  return (
    <div className="relative" style={{ width, height: viewportHeight }}>
      {/* Clipped and faded rows */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        {rows.map((text, index) => {
          const dist = Math.abs(index - clampedPos);
          // Rows outside the viewport (plus one row of slack) are skipped.
          if (dist > visibleAround + 1) return null;

          const baseColor = hexLerp(
            label.colorNearMoving,
            label.colorEdge,
            Math.min(1, dist / visibleAround)
          );
          const proximity = Math.max(0, 1 - dist / label.proximityRange);
          const color = hexLerp(baseColor, nearColor, proximity);
          const showRing = confirmationProgress > 0 && index === clampedPos;

          return (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="absolute left-0 w-full text-center font-bold"
              style={{
                top: centerTop + (index - clampedPos) * rowHeight,
                height: rowHeight,
                lineHeight: `${rowHeight}px`,
                fontSize: label.fontSize,
                whiteSpace: 'nowrap',
                color,
              }}
            >
              <span className="relative inline-block">
                {text}
                {/* Confirmation ring (out of flow, so the text never shifts) */}
                {showRing && (
                  <span
                    className="absolute block"
                    style={{
                      left: '100%',
                      top: '50%',
                      marginLeft: ring.gap,
                      width: ring.size,
                      height: ring.size,
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <ProgressRing progress={confirmationProgress} color={ring.color} />
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Frame lines around the centered row */}
      <div
        className="absolute left-0 w-full"
        style={{ ...frameStyle, top: centerTop - frame.height }}
      />
      <div
        className="absolute left-0 w-full"
        style={{ ...frameStyle, top: centerTop + rowHeight }}
      />
    </div>
  );
}

// Control contract (see src/lib/game/ui-controls.js).
OptionDrum.placement = 'sequential';
OptionDrum.gearRatio = theme.drum.gearRatio;
