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
  100: '#f5f5f5',
  150: '#ebebeb',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  600: '#525252',
};

export default {
  neutral,
  rail: {
    color: neutral[600],
    height: 16,
  },
  marker: {
    color: neutral[600],
    radius: 20,
  },
  cursor: {
    radiusAtRest: 20,
    radiusAtMax: 26,
    colorAtRest: neutral[150],
    colorAtMax: '#ffffff',
  },
  label: {
    fontSizeMin: 30,
    fontSizeMax: 38,
    colorFar: neutral[400],
    colorNearMoving: neutral[150],
    colorNearResting: '#ffffff',
    offsetY: 90,
    proximityRange: 0.5,
  },
  ring: {
    size: 80,
    color: '#ffffff',
  },
  layout: {
    stepWidth: 220,
    railPaddingX: 40,
    height: 60,
  },
};
