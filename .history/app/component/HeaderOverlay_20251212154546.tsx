"use client";
import { useState } from "react";

export default function HeaderOverlay() {
  const [draggable, setDraggable] = useState(true);

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  const toggleDraggable = () => {
    setDraggable(!draggable);
  };

  return (
    <div
      className="w-full h-10 flex items-center justify-between p-2 pb-4"
      style={{ WebkitAppRegion: draggable ? "drag" : "no-drag" } as any}
    >
      <span className="text-white font-bold">Overlay App</span>
      <div
        className="flex space-x-2"
        style={{ WebkitAppRegion: "no-drag" } as any}
      >
        <div className="text-center items-center">help</div>
        <button
          className="px-2 py-1 bg-blue-500 hover:bg-blue-400 text-white rounded"
          onClick={toggleDraggable}
        >
          {draggable ? "Lock Drag" : "Enable Drag"}
        </button>
        <button
          className="px-2 py-1 bg-red-500 hover:bg-red-400 text-white rounded"
          onClick={handleClose}
        >
          Exit
        </button>
      </div>
    </div>
  );
}
