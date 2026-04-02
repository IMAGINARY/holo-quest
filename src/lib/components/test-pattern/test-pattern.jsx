import { useMemo } from 'react';
import { TestPatternContext } from './use-test-pattern-element';

export default function TestPattern({ width, height, children }) {
  const value = useMemo(() => ({ width, height }), [width, height]);

  return (
    <TestPatternContext.Provider value={value}>
      <div className="absolute inset-0">
        {children}
      </div>
    </TestPatternContext.Provider>
  );
}
