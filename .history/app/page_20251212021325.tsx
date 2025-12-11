"use client";
import { useState } from "react";

export default function Home() {
  const [draggable, setDraggable] = useState(true);

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  const toggleDraggable = () => {
    setDraggable(!draggable);
  };

  return (
    <div id="app-wrapper" className="bg-black/20 w-screen h-screen p-4">
      {/* Header that can be draggable */}
      <div
        className="h-10 w-full flex items-center justify-between px-2"
        style={
          {
            WebkitAppRegion: draggable ? "drag" : "no-drag",
          } as any
        }
      >
        <span className="text-white font-bold">Overlay Header</span>
        <div className="flex space-x-2">
          {/* Toggle draggable button */}
          <button
            className="px-2 py-1 bg-blue-500 hover:bg-blue-400 text-white rounded"
            style={{ WebkitAppRegion: "no-drag" } as any}
            onClick={toggleDraggable}
          >
            {draggable ? "Lock Drag" : "Enable Drag"}
          </button>

          {/* Exit button */}
          <button
            className="px-2 py-1 bg-red-500 hover:bg-red-400 text-white rounded"
            style={{ WebkitAppRegion: "no-drag" } as any}
            onClick={handleClose}
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="mt-4 text-white">
        <h1 className="text-lg">My Overlay App</h1>
        <p>Click the blue button to toggle draggable area.</p>
      </div>
    </div>
  );
}
