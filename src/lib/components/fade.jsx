import { useEffect, useRef, useState } from 'react';

export default function Fade({ show, duration = 350, children }) {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);
  const lastChildrenRef = useRef(children);

  if (show) {
    lastChildrenRef.current = children;
  }

  useEffect(() => {
    if (show) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const timer = setTimeout(() => setMounted(false), duration);
    return () => clearTimeout(timer);
  }, [show, duration]);

  if (!mounted) return null;

  return (
    <div
      className={`transition-opacity ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {show ? children : lastChildrenRef.current}
    </div>
  );
}
