/**
 * Linearly interpolate between two values.
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Parse a hex color (#rrggbb) into [r, g, b].
 */
function parseHex(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/**
 * Linearly interpolate between two hex colors.
 */
export function hexLerp(hexA, hexB, t) {
  const [r1, g1, b1] = parseHex(hexA);
  const [r2, g2, b2] = parseHex(hexB);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const neutral = {
  200: '#e5e5e5',
  300: '#d4d4d4',
  600: '#525252',
};

export default {
  neutral,
  rail: { color: neutral[600], height: 2 },
  marker: { color: neutral[600], radius: 4 },
  cursor: {
    radiusAtRest: 8,
    radiusAtMax: 10,
    colorAtRest: neutral[200],
    colorAtMax: '#ffffff',
  },
  label: {
    fontSizeMin: 14,
    fontSizeMax: 18,
    colorFar: neutral[600],
    colorNearMoving: neutral[200],
    colorNearResting: '#ffffff',
    offsetY: 24,
    proximityRange: 1,
  },
  layout: {
    stepWidth: 80,
    railPaddingX: 40,
    height: 60,
  },
};
