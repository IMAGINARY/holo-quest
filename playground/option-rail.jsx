import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ScaleToFit from '../src/lib/components/scale-to-fit';
import { OptionRail } from '../src/lib/components/spinner-ui';

const sampleOptions = {
  '-3': 'Very Low',
  '-2': 'Low',
  '-1': 'Slightly Low',
  1: 'Slightly High',
  2: 'High',
  3: 'Very High',
};

function App() {
  const [position, setPosition] = useState(0);
  const [velocity, setVelocity] = useState(0);

  return (
    <div className="flex justify-center h-screen">
      <ScaleToFit contentWidth={1920} contentHeight={1080}>
        <div style={{ width: 1920, height: 1080 }} className="bg-black flex flex-col items-center justify-center gap-12">
          <h1 className="text-2xl font-bold text-white">OptionRail Playground</h1>

          <OptionRail
            options={sampleOptions}
            position={position}
            velocity={velocity}
          />

          <div className="flex flex-col gap-6 w-[480px]">
            <label className="flex flex-col gap-1 text-white text-sm">
              <span>
                Position:
                {' '}
                {position.toFixed(2)}
              </span>
              <input
                type="range"
                min="-3"
                max="3"
                step="0.01"
                value={position}
                onChange={(e) => setPosition(parseFloat(e.target.value))}
                className="w-full"
              />
            </label>

            <label className="flex flex-col gap-1 text-white text-sm">
              <span>
                Velocity:
                {' '}
                {velocity.toFixed(2)}
              </span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={velocity}
                onChange={(e) => setVelocity(parseFloat(e.target.value))}
                className="w-full"
              />
            </label>
          </div>
        </div>
      </ScaleToFit>
    </div>
  );
}

createRoot(document.getElementById('app')).render(<App />);
