"use client";

export default function Home() {
  const handleClose = () => {
    console.log("Close clicked");
  };

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
          style={{ WebkitAppRegion: "no-drag" } as any}
          onClick={handleClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
