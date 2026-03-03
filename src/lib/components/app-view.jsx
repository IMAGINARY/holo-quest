import HoloDisplay from './holo-display';
import {
  TestPattern,
  ActiveArea,
  Crosshair,
  DiagonalCrosshair,
  ColorSwatches,
  SmallCrosshair,
} from './test-pattern';

export default function AppView({ config }) {
  const { width, height } = config.holoDisplay;

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <HoloDisplay config={config}>
        <HoloDisplay.Front>
          <TestPattern width={width} height={height}>
            <ActiveArea />
            <Crosshair />
            <DiagonalCrosshair />
            <ColorSwatches
              x={10}
              y={85}
              width={80}
              height={10}
              colors={['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f']}
            />
          </TestPattern>
        </HoloDisplay.Front>
        <HoloDisplay.Back>
          <TestPattern width={width} height={height}>
            <ActiveArea />
            <Crosshair />
            <SmallCrosshair x={25} y={25} width={5} height={5} />
            <SmallCrosshair x={75} y={25} width={5} height={5} />
            <SmallCrosshair x={25} y={75} width={5} height={5} />
            <SmallCrosshair x={75} y={75} width={5} height={5} />
            <ColorSwatches
              x={10}
              y={85}
              width={80}
              height={10}
              colors={['#fff', '#ccc', '#999', '#666', '#333', '#000']}
            />
          </TestPattern>
        </HoloDisplay.Back>
      </HoloDisplay>
    </div>
  );
}
