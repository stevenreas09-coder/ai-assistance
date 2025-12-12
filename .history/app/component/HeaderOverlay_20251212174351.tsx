"use client";
import { useState } from "react";
import { IoMdExit } from "react-icons/io";
import { RiDragMove2Fill } from "react-icons/ri";
import { ImBlocked } from "react-icons/im";

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
      <span className="">MyIA</span>
      <div
        className="flex space-x-4"
        style={{ WebkitAppRegion: "no-drag" } as any}
      >
        <div className="flex items-center">Setings</div>
        <div className="text-center flex items-center">Help</div>
        <button
          title="Drag Windows"
          className="text-white hover:text-amber-500 rounded"
          onClick={toggleDraggable}
        >
          {draggable ? (
            <RiDragMove2Fill className="w-4 h-4" />
          ) : (
            <ImBlocked className="w-4 h-4" />
          )}
        </button>
        <button
          title="Exit"
          onClick={handleClose}
          className="flex items-center hover:text-amber-500 justify-center"
        >
          <IoMdExit className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
