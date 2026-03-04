import React from 'react';
import { createRoot } from 'react-dom/client';
import ScaleToFit from '../src/lib/components/scale-to-fit';

function App() {
  return (
    <div className="flex justify-center h-screen">
      <ScaleToFit contentWidth={1920} contentHeight={1080}>
        <div style={{ width: 1920, height: 1080 }} className="bg-black">
          <h1 className="text-2xl font-bold text-white p-8">Playground Template</h1>
          <p className="px-8 text-base-content/70">
            Copy this file to create a new playground experiment.
          </p>
        </div>
      </ScaleToFit>
    </div>
  );
}

createRoot(document.getElementById('app')).render(<App />);
