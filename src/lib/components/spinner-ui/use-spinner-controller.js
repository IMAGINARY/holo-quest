import { useState, useRef, useEffect } from 'react';

// eslint-disable-next-line import/prefer-default-export
export function useSpinnerController({
  enabled = true,
  min = -3,
  max = 3,
  step,
  sensitivity = 0.0125,
  maxVelocity = 15,
  friction = 0.35,
  wellStrength = 10,
  pullStrength = 20,
  captureSpeed = 0.75,
  settleThreshold = 0.05,
  stickyForce = 15,
  confirmationDelay = 2,
  // Steps travelled per unit of the base calibration. The physics values
  // above are tuned for gearRatio 1 (OptionRail); a control with denser
  // steps raises it to move faster while keeping the same feel: the same
  // twist breaks stickiness, and wells capture and settle the same way.
  // Keep settleThreshold * gearRatio well under step / 2.
  gearRatio = 1,
  onConfirm,
} = {}) {
  const discrete = step > 0;

  const configRef = useRef();
  configRef.current = {
    enabled,
    min,
    max,
    step,
    // Thresholds expressed in position units scale with the gear ratio;
    // friction, well damping and the capture spring are scale-invariant.
    sensitivity: sensitivity * gearRatio,
    maxVelocity: maxVelocity * gearRatio,
    friction,
    wellStrength,
    pullStrength,
    captureSpeed: captureSpeed * gearRatio,
    settleThreshold: settleThreshold * gearRatio,
    stickyForce: stickyForce * gearRatio,
    gearRatio,
    confirmationDelay,
    onConfirm,
    discrete,
  };

  const physicsRef = useRef({
    position: discrete
      ? min + Math.round((0 - min) / step) * step
      : (min + max) / 2,
    velocity: 0,
    accumulatedDelta: 0,
    isSettled: discrete,
    lastTimestamp: null,
    confirmationElapsed: 0,
    isConfirmed: false,
  });

  const prevEnabledRef = useRef(enabled);
  const rafRef = useRef(null);

  const [state, setState] = useState({
    position: physicsRef.current.position,
    velocity: 0,
    isSettled: physicsRef.current.isSettled,
    confirmationProgress: 0,
  });

  useEffect(() => {
    function onMouseMove(e) {
      if (document.pointerLockElement !== document.documentElement) return;
      if (!configRef.current.enabled) return;
      physicsRef.current.accumulatedDelta += e.movementX;
    }

    function tick(timestamp) {
      rafRef.current = requestAnimationFrame(tick);

      const p = physicsRef.current;
      const c = configRef.current;

      // On enable→disable, freeze the rail, drop pending input, and reset the
      // confirmation countdown so a near-completed intent can't fire when the
      // controller resumes. Nulling lastTimestamp makes the next enabled tick
      // re-init its dt clock instead of applying the disabled-period gap.
      if (prevEnabledRef.current !== c.enabled) {
        if (!c.enabled) {
          p.accumulatedDelta = 0;
          p.confirmationElapsed = 0;
          p.isConfirmed = false;
          p.lastTimestamp = null;
        }
        prevEnabledRef.current = c.enabled;
      }

      if (!c.enabled) return;

      if (p.lastTimestamp === null) {
        p.lastTimestamp = timestamp;
        setState({
          position: p.position,
          velocity: p.velocity / c.gearRatio,
          isSettled: p.isSettled,
          confirmationProgress: 0,
        });
        return;
      }

      const dt = Math.min((timestamp - p.lastTimestamp) / 1000, 0.1);
      p.lastTimestamp = timestamp;

      // 2. Consume accumulated delta
      let inputForce = p.accumulatedDelta * c.sensitivity;
      p.accumulatedDelta = 0;

      // 3. Sticky check (discrete + settled)
      if (c.discrete && p.isSettled) {
        if (Math.abs(inputForce) < c.stickyForce * dt) {
          inputForce = 0;
        } else {
          p.isSettled = false;
        }
      }

      // 4. Apply input
      p.velocity += inputForce;

      // 5a. Well damping (discrete + not settled)
      if (c.discrete && !p.isSettled) {
        const nearest = c.min
          + Math.round((p.position - c.min) / c.step) * c.step;
        const dist = Math.abs(p.position - nearest);
        const halfStep = c.step / 2;
        if (dist < halfStep) {
          const wellDepth = 1 - dist / halfStep;
          p.velocity *= Math.max(0, 1 - wellDepth * c.wellStrength * dt);
        }

        // 5b. Capture pull (slow enough → gentle pull to nearest)
        if (Math.abs(p.velocity) < c.captureSpeed) {
          p.velocity += (nearest - p.position) * c.pullStrength * dt;
        }
      }

      // 6. Friction
      p.velocity *= (1 - c.friction * dt);

      // 7. Clamp velocity
      if (p.velocity > c.maxVelocity) p.velocity = c.maxVelocity;
      if (p.velocity < -c.maxVelocity) p.velocity = -c.maxVelocity;

      // 8. Update position
      p.position += p.velocity * dt;

      // 9. Clamp position + boundary stop. Widen to include 0 so the
      // neutral resting position is always reachable, even when all
      // option keys sit on one side of 0.
      const effectiveMin = Math.min(0, c.min);
      const effectiveMax = Math.max(0, c.max);
      if (p.position < effectiveMin) {
        p.position = effectiveMin;
        p.velocity = 0;
      } else if (p.position > effectiveMax) {
        p.position = effectiveMax;
        p.velocity = 0;
      }

      // 10. Settle check (discrete + not settled)
      if (c.discrete && !p.isSettled) {
        const nearest = c.min
          + Math.round((p.position - c.min) / c.step) * c.step;
        if (
          Math.abs(p.velocity) < c.settleThreshold
          && Math.abs(p.position - nearest) < c.settleThreshold
        ) {
          p.position = nearest;
          p.velocity = 0;
          p.isSettled = true;
        }
      }

      // 11. Confirmation progress (discrete + settled, not at neutral)
      if (c.discrete && p.isSettled && !p.isConfirmed && p.position !== 0) {
        p.confirmationElapsed += dt;
        const progress = Math.min(1, p.confirmationElapsed / c.confirmationDelay);
        if (progress >= 1) {
          p.isConfirmed = true;
          if (c.onConfirm) c.onConfirm(p.position);
        }
      } else if (!p.isSettled || p.position === 0) {
        p.confirmationElapsed = 0;
        p.isConfirmed = false;
      }

      // 12. Push state to React
      // Velocity is reported in base (gearRatio 1) units so views can
      // style by it the same way regardless of gearing.
      setState({
        position: p.position,
        velocity: p.velocity / c.gearRatio,
        isSettled: p.isSettled,
        confirmationProgress: (() => {
          if (c.discrete && p.isSettled && !p.isConfirmed) {
            return Math.min(1, p.confirmationElapsed / c.confirmationDelay);
          }
          return p.isConfirmed ? 1 : 0;
        })(),
      });
    }

    document.addEventListener('mousemove', onMouseMove);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return {
    position: state.position,
    velocity: state.velocity,
    isSettled: state.isSettled,
    confirmationProgress: state.confirmationProgress,
  };
}
