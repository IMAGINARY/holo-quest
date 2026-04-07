import { logger } from '../helpers/logger';

/**
 * Parse a screen adjustment query string value.
 *
 * Expected format: `<offsetX>,<offsetY>,<scaleX>,<scaleY>` (4 comma-separated numbers).
 *
 * @param {string} value  Raw query string value
 * @param {string} paramName  Name of the query parameter (for error messages)
 * @return {{ offsetX: number, offsetY: number, scaleX: number, scaleY: number }|null}
 */
function parseScreenAdjustment(value, paramName) {
  const parts = value.split(',');
  if (parts.length !== 4) {
    logger.error('%s: expected 4 comma-separated numbers, got %d', paramName, parts.length);
    return null;
  }
  const nums = parts.map(Number);
  if (nums.some(Number.isNaN)) {
    logger.error('%s: all values must be valid numbers', paramName);
    return null;
  }
  const [offsetX, offsetY, scaleX, scaleY] = nums;
  return {
    offsetX, offsetY, scaleX, scaleY,
  };
}

/**
 * Build config overrides from query string screen-adjustment parameters.
 *
 * @param {URLSearchParams} qs
 * @return {Object} Overrides map (empty object if none)
 */
export default function getQsConfigOverrides(qs) {
  const overrides = {};
  const frontAdj = qs.get('frontAdj');
  if (frontAdj) {
    const adj = parseScreenAdjustment(frontAdj, 'frontAdj');
    if (adj) {
      overrides['frontAdj query string'] = {
        holoDisplay: { screens: { front: adj } },
      };
    }
  }
  const backAdj = qs.get('backAdj');
  if (backAdj) {
    const adj = parseScreenAdjustment(backAdj, 'backAdj');
    if (adj) {
      overrides['backAdj query string'] = {
        holoDisplay: { screens: { back: adj } },
      };
    }
  }
  const hdSim = qs.get('hdSim');
  if (hdSim !== null) {
    overrides['hdSim query string'] = {
      holoDisplay: { simulationMode: true },
    };
  }
  return overrides;
}
