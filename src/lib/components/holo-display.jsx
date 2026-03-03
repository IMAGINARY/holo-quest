/**
 * @module holo-display
 *
 * Dual-screen layout for a pepper's ghost holographic display.
 * A "front" screen is reflected on angled glass while a "back" screen
 * is viewed directly through it, creating the illusion of a floating image.
 *
 * Hardware-specific settings (screen sizes, brightness, rotation, layout
 * direction) are driven by {@link config/holo-display.yml}.
 */
import { Children } from 'react';

/**
 * Slot component that wraps content destined for the front (reflected) screen.
 * Use as `<HoloDisplay.Front>`.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
function Front({ children }) {
  return children;
}

/**
 * Slot component that wraps content destined for the back (direct-view) screen.
 * Use as `<HoloDisplay.Back>`.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
function Back({ children }) {
  return children;
}

/**
 * Sized and styled container for a single screen in the holographic display.
 * Applies dimensions, optional brightness adjustment, and 180° rotation.
 *
 * @param {object} props
 * @param {number} props.width            — Viewport width in pixels.
 * @param {number} props.height           — Viewport height in pixels.
 * @param {object} props.screen
 * @param {number} props.screen.brightness — CSS brightness multiplier (1 = unchanged).
 * @param {boolean} props.screen.rotated  — Whether to rotate the viewport 180°.
 * @param {React.ReactNode} props.children
 */
function DisplayViewport({
  width, height, screen, style: styleProp, children,
}) {
  const style = {
    width: `${width}px`,
    height: `${height}px`,
  };

  if (screen.brightness !== 1) {
    style.filter = `brightness(${screen.brightness})`;
  }

  if (screen.rotated) {
    style.transform = 'rotate(180deg)';
  }

  Object.assign(style, styleProp);

  return (
    <div className="relative shrink-0 overflow-hidden" style={style}>
      {children}
    </div>
  );
}

/**
 * Main dual-screen holographic display component.
 *
 * Uses a compound component pattern — nest `<HoloDisplay.Front>` and
 * `<HoloDisplay.Back>` as direct children to assign content to each screen.
 *
 * @example
 * <HoloDisplay config={config}>
 *   <HoloDisplay.Front><GameScene /></HoloDisplay.Front>
 *   <HoloDisplay.Back><Background /></HoloDisplay.Back>
 * </HoloDisplay>
 *
 * @param {object} props
 * @param {object} props.config — Application config containing `holoDisplay` settings.
 * @param {React.ReactNode} props.children — Must include `HoloDisplay.Front` and/or
 *   `HoloDisplay.Back` elements.
 */
export default function HoloDisplay({ config, children }) {
  const { holoDisplay } = config;
  const {
    simulationMode, screenDistribution, invertScreenOrder, width, height, screens,
  } = holoDisplay;

  // Simulation overrides: disable rotation, stack screens, add blend mode to front
  const frontScreen = simulationMode ? { ...screens.front, rotated: false } : screens.front;
  const backScreen = simulationMode ? { ...screens.back, rotated: false } : screens.back;

  const frontStyle = simulationMode
    ? { position: 'absolute', zIndex: 1, mixBlendMode: 'screen' }
    : {};
  const backStyle = simulationMode ? { position: 'absolute' } : {};

  const containerClass = simulationMode
    ? 'relative'
    : `flex ${screenDistribution === 'vertical' ? 'flex-col' : 'flex-row'}`;
  const containerStyle = simulationMode
    ? { width: `${width}px`, height: `${height}px` }
    : {};

  let frontContent = null;
  let backContent = null;

  Children.forEach(children, (child) => {
    if (child && child.type === Front) {
      frontContent = child.props.children;
    } else if (child && child.type === Back) {
      backContent = child.props.children;
    }
  });

  const frontViewport = (
    <DisplayViewport width={width} height={height} screen={frontScreen} style={frontStyle}>
      {frontContent}
    </DisplayViewport>
  );

  const backViewport = (
    <DisplayViewport width={width} height={height} screen={backScreen} style={backStyle}>
      {backContent}
    </DisplayViewport>
  );

  const first = invertScreenOrder ? backViewport : frontViewport;
  const second = invertScreenOrder ? frontViewport : backViewport;

  return (
    <div className={containerClass} style={containerStyle}>
      {first}
      {second}
    </div>
  );
}

HoloDisplay.Front = Front;
HoloDisplay.Back = Back;
