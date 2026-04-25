import { useState, useEffect, useCallback } from 'react';

// eslint-disable-next-line import/prefer-default-export
export function usePointerLock() {
  const [isLocked, setIsLocked] = useState(false);

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
      setIsLocked(document.pointerLockElement === document.documentElement);
    }

    function onLockError() {
      // eslint-disable-next-line no-console
      console.warn('Pointer lock request failed');
    }

    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('pointerlockerror', onLockError);

    return () => {
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('pointerlockerror', onLockError);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
  }, []);

  return { isLocked, requestLock };
}
