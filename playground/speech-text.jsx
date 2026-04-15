import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ScaleToFit from '../src/lib/components/scale-to-fit';
import SpeechText, { Speeds } from '../src/lib/components/speech-text';
import '../src/styles/speech-text.css';

const demoSegments = [
  { string: 'Hello, traveler.', speed: Speeds.normal },
  { string: 'Welcome to the', speed: Speeds.normal },
  { string: 'Holo-Quest!', speed: Speeds.slow, classes: ['highlight'] },
];

const multiSpeedSegments = [
  { string: 'This is normal speed.', speed: Speeds.normal },
  { string: '\n' },
  { string: 'This is slow...', speed: Speeds.slow },
  { string: '\n' },
  { string: 'And this is super fast!', speed: Speeds.superFast },
];

function Demo({ title, segments }) {
  const speechRef = useRef();
  const [status, setStatus] = useState('revealing...');

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
      <div className="bg-black/50 rounded-lg p-4 mb-2">
        <SpeechText
          ref={speechRef}
          segments={segments}
          onComplete={() => setStatus('complete')}
        />
      </div>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => speechRef.current?.revealAll()}
        >
          Reveal All
        </button>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={() => speechRef.current?.speedUp()}
        >
          Speed Up
        </button>
        <button
          type="button"
          className="btn btn-sm btn-warning"
          onClick={() => speechRef.current?.stop()}
        >
          Stop
        </button>
        <button
          type="button"
          className="btn btn-sm btn-success"
          onClick={() => speechRef.current?.resume()}
        >
          Resume
        </button>
        <span className="text-sm text-base-content/60 ml-2">
          Status:
          {' '}
          {status}
        </span>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="flex justify-center h-screen">
      <ScaleToFit contentWidth={1920} contentHeight={1080}>
        <div style={{ width: 1920, height: 1080 }} className="bg-black p-8">
          <h1 className="text-2xl font-bold text-white mb-6">SpeechText Playground</h1>

          <style>
            {`
              .speech-text {
                color: white;
                font-size: 1.5rem;
                line-height: 2;
              }
              .speech-text span.highlight {
                color: #f59e0b;
                font-weight: bold;
              }
            `}
          </style>

          <Demo title="Basic Speech" segments={demoSegments} />
          <Demo title="Multi-speed with Line Breaks" segments={multiSpeedSegments} />
        </div>
      </ScaleToFit>
    </div>
  );
}

createRoot(document.getElementById('app')).render(<App />);
