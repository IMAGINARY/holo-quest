import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Playground Template</h1>
      <p className="mt-2 text-base-content/70">
        Copy this file to create a new playground experiment.
      </p>
    </div>
  );
}

createRoot(document.getElementById('app')).render(<App />);
