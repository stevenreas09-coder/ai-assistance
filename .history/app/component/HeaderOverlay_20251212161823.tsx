"use client";
import { useState } from "react";
import { IoMdExit } from "react-icons/io";

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
      className="w-full h-10 flex items-center text-white font-normal justify-between p-2 pb-4 text-sm"
      style={{ WebkitAppRegion: draggable ? "drag" : "no-drag" } as any}
    >
      <span className="">Overlay App</span>
      <div
        className="flex space-x-2"
        style={{ WebkitAppRegion: "no-drag" } as any}
      >
        <div className="flex items-center">Setings</div>
        <div className="text-center flex items-center">Help</div>
        <button
          className="px-2 py-1 bg-blue-500 hover:bg-blue-400 text-white rounded"
          onClick={toggleDraggable}
        >
          {draggable ? "Lock Drag" : "Enable Drag"}
        </button>
        <IoMdExit className="w-5 h-5 flex">
          <button onClick={handleClose}></button>
        </IoMdExit>
      </div>
    </div>
  );
}
