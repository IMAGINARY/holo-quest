import HoloDisplay from './holo-display';

export default function AppView({ config }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <HoloDisplay config={config}>
        <HoloDisplay.Front>
          <div className="flex h-full w-full items-center justify-center text-3xl text-white">
            Front Screen
          </div>
        </HoloDisplay.Front>
        <HoloDisplay.Back>
          <div className="flex h-full w-full items-center justify-center text-3xl text-white">
            Back Screen
          </div>
        </HoloDisplay.Back>
      </HoloDisplay>
    </div>
  );
}
