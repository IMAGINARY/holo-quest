import ScaleToFit from '../src/lib/components/scale-to-fit';
import { OptionRail, useSpinnerController, usePointerLock } from '../src/lib/components/spinner-ui';

const sampleOptions = {
  '-3': 'Very Low',
  '-2': 'Low',
  '-1': 'Slightly Low',
  1: 'Slightly High',
  2: 'High',
  3: 'Very High',
};

export default function App() {
  const { isLocked, requestLock } = usePointerLock();

  const {
    position, velocity, isSettled, confirmationProgress,
  } = useSpinnerController({
    min: Object.keys(sampleOptions).map(Number).reduce((a, b) => Math.min(a, b), Infinity),
    max: Object.keys(sampleOptions).map(Number).reduce((a, b) => Math.max(a, b), -Infinity),
    step: 1,
    // eslint-disable-next-line no-console
    onConfirm: (value) => console.log('Input:', value),
  });

  return (
    <div className="flex justify-center h-screen">
      <ScaleToFit contentWidth={1920} contentHeight={1080}>
        <div style={{ width: 1920, height: 1080 }} className="bg-black flex flex-col items-center justify-center gap-12">
          <h1 className="text-4xl font-bold text-white mb-20">OptionRail Playground</h1>

          <OptionRail
            options={sampleOptions}
            position={position}
            velocity={velocity}
            confirmationProgress={confirmationProgress}
          />

          <button
            type="button"
            className="btn btn-primary"
            onClick={requestLock}
          >
            {isLocked ? 'Spinner Locked' : 'Lock Spinner'}
          </button>

          <div className="text-white text-sm font-mono space-y-1">
            <div>
              Position:
              {' '}
              {position.toFixed(3)}
            </div>
            <div>
              Velocity:
              {' '}
              {velocity.toFixed(3)}
            </div>
            <div>
              Settled:
              {' '}
              {isSettled ? 'Yes' : 'No'}
            </div>
            <div>
              Locked:
              {' '}
              {isLocked ? 'Yes' : 'No'}
            </div>
            <div>
              Confirmation:
              {' '}
              {(confirmationProgress * 100).toFixed(0)}
              %
            </div>
          </div>
        </div>
      </ScaleToFit>
    </div>
  );
}
