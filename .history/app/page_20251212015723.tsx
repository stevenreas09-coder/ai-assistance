export default function Home() {
  return (
    <div id="app-wrapper" className="bg-black/20">
      {/* Draggable header */}
      <div
        className="h-10 w-full"
        style={{ WebkitAppRegion: "drag" } as any}
      ></div>

      {/* Your main content */}
      <div className="p-4">
        <h1 className="text-white text-lg">My Overlay App</h1>
        <button
          className="px-3 py-1 hover:bg-red-300 bg-red-500 text-white rounded"
          style={{ WebkitAppRegion: "drag" } as any}
          onClick={() => window.close()} // example close action
        >
          Close
        </button>
      </div>
    </div>
  );
}
