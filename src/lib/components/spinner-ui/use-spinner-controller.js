import {
  useState, useRef, useEffect, useCallback,
} from 'react';

// eslint-disable-next-line import/prefer-default-export
export function useSpinnerController({
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
  onConfirm,
} = {}) {
  const discrete = step > 0;

  const configRef = useRef();
  configRef.current = {
    min,
    max,
    step,
    sensitivity,
    maxVelocity,
    friction,
    wellStrength,
    pullStrength,
    captureSpeed,
    settleThreshold,
    stickyForce,
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
    isLocked: false,
    lastTimestamp: null,
    confirmationElapsed: 0,
    isConfirmed: false,
  });

  const rafRef = useRef(null);

  const [state, setState] = useState({
    position: physicsRef.current.position,
    velocity: 0,
    isSettled: physicsRef.current.isSettled,
    isLocked: false,
    confirmationProgress: 0,
  });

  const requestLock = useCallback(() => {
    const el = document.documentElement;
    try {
      const promise = el.requestPointerLock({ unadjustedMovement: true });
      if (promise && promise.catch) {
        promise.catch(() => {
          el.requestPointerLock();
        });
      }
    } catch {
      el.requestPointerLock();
    }
  }, []);

  useEffect(() => {
    function onLockChange() {
      const locked = document.pointerLockElement === document.documentElement;
      physicsRef.current.isLocked = locked;
    }

    function onMouseMove(e) {
      if (!physicsRef.current.isLocked) return;
      physicsRef.current.accumulatedDelta += e.movementX;
    }

    function onLockError() {
      // eslint-disable-next-line no-console
      console.warn('Pointer lock request failed');
    }

    function tick(timestamp) {
      rafRef.current = requestAnimationFrame(tick);

      const p = physicsRef.current;
      const c = configRef.current;

      if (p.lastTimestamp === null) {
        p.lastTimestamp = timestamp;
        setState({
          position: p.position,
          velocity: p.velocity,
          isSettled: p.isSettled,
          isLocked: p.isLocked,
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

      // 9. Clamp position + boundary stop
      if (p.position < c.min) {
        p.position = c.min;
        p.velocity = 0;
      } else if (p.position > c.max) {
        p.position = c.max;
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
      setState({
        position: p.position,
        velocity: p.velocity,
        isSettled: p.isSettled,
        isLocked: p.isLocked,
        confirmationProgress: (() => {
          if (c.discrete && p.isSettled && !p.isConfirmed) {
            return Math.min(1, p.confirmationElapsed / c.confirmationDelay);
          }
          return p.isConfirmed ? 1 : 0;
        })(),
      });
    }

    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockerror', onLockError);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockerror', onLockError);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
  }, []);

  return {
    position: state.position,
    velocity: state.velocity,
    isSettled: state.isSettled,
    isLocked: state.isLocked,
    confirmationProgress: state.confirmationProgress,
    requestLock,
  };
}
