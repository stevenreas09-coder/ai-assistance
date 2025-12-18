"use client";
import { useState } from "react";
import { IoMdExit } from "react-icons/io";
import { RiDragMove2Fill } from "react-icons/ri";
import { ImBlocked } from "react-icons/im";
import Link from "next/link";

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
      // select-none prevents text highlighting while dragging
      className="w-full h-8 flex items-center text-white/40 font-normal text-sm justify-between px-3 select-none border-b border-black/5"
      style={{ WebkitAppRegion: draggable ? "drag" : "no-drag" } as any}
    >
      {/* LEFT: Navigation Link */}
      <div style={{ WebkitAppRegion: "no-drag" } as any}>
        <Link href="/" className="hover:text-amber-600 transition-colors py-1">
          Home
        </Link>
      </div>

      {/* RIGHT: Controls */}
      <div
        className="flex items-center space-x-4"
        style={{ WebkitAppRegion: "no-drag" } as any}
      >
        <div className="hover:text-amber-600 cursor-pointer">Settings</div>
        <div className="hover:text-amber-600 cursor-pointer">Help</div>

        <div className="flex items-center gap-3 border-l border-black/10 pl-3">
          <button
            title={draggable ? "Disable Drag" : "Enable Drag"}
            className="hover:text-amber-500 transition-all active:scale-90"
            onClick={toggleDraggable}
          >
            {draggable ? (
              <RiDragMove2Fill className="w-4 h-4" />
            ) : (
              <ImBlocked className="w-4 h-4 text-red-400" />
            )}
          </button>

          <button
            title="Exit"
            onClick={handleClose}
            className="hover:text-red-500 transition-all active:scale-90"
          >
            <IoMdExit className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
