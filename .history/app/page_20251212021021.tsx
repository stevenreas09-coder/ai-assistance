"use client";

export default function Home() {
  const handleClose = () => {
    // Call Electron's IPC to close window
    window.electronAPI?.closeWindow();
  };

  return (
    <div id="app-wrapper" className="bg-black/20 w-screen h-screen">
      {/* Draggable header */}
      <div
        className="h-10 w-full"
        style={{ WebkitAppRegion: "drag" } as any}
      ></div>

      {/* Main content */}
      <div className="p-4">
        <h1 className="text-white text-lg">My Overlay App</h1>
        <button
          className="px-3 py-1 mt-2 bg-red-500 hover:bg-red-300 text-white rounded"
          style={{ WebkitAppRegion: "no-drag" } as any}
          onClick={handleClose}
        >
          Exit
        </button>
      </div>
    </div>
  );
}
