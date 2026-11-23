import React from 'react';

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// strokeWidth is in viewBox units (out of 100), so it scales with the ring's
// rendered size. Above 20 the stroke overflows the viewBox and clips.
export default function ProgressRing({ progress = 0, color = 'white', strokeWidth = 10 }) {
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <svg viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
}
