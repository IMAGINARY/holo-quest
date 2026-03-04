import { useRef, useState, useEffect } from 'react';

export default function ScaleToFit({
  contentWidth, contentHeight, className = '', children,
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) {
        setScale(1);
        return;
      }
      setScale(Math.min(width / contentWidth, height / contentHeight));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [contentWidth, contentHeight]);

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: contentWidth,
        height: contentHeight,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: 'center',
      }}
      >
        {children}
      </div>
    </div>
  );
}
