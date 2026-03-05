import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ScaleToFit from '../src/lib/components/scale-to-fit';
import { ProgressRing } from '../src/lib/components/spinner-ui';

const COLORS = ['white', '#22d3ee', '#f472b6', '#a3e635'];
const SIZES = [64, 120, 200];

function App() {
  const [progress, setProgress] = useState(0.65);

  return (
    <div className="flex justify-center h-screen">
      <ScaleToFit contentWidth={1920} contentHeight={1080}>
        <div style={{ width: 1920, height: 1080 }} className="bg-black p-8">
          <h1 className="text-2xl font-bold text-white mb-6">ProgressRing</h1>

          <label className="text-white block mb-4">
            {'progress: '}
            {progress.toFixed(2)}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="block w-80 mt-1"
            />
          </label>

          <div className="flex items-end gap-12 mt-8">
            {COLORS.map((color) => (
              <div key={color} className="flex flex-col items-center gap-2">
                <div style={{ width: 120, height: 120 }}>
                  <ProgressRing progress={progress} color={color} />
                </div>
                <span className="text-white/60 text-sm">{color}</span>
              </div>
            ))}
          </div>

          <h2 className="text-xl text-white mt-10 mb-4">Container sizes</h2>
          <div className="flex items-end gap-12">
            {SIZES.map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <div style={{ width: size, height: size }}>
                  <ProgressRing progress={progress} />
                </div>
                <span className="text-white/60 text-sm">
                  {size}
                  {'×'}
                  {size}
                </span>
              </div>
            ))}
          </div>
        </div>
      </ScaleToFit>
    </div>
  );
}

createRoot(document.getElementById('app')).render(<App />);
