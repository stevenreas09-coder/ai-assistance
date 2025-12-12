import { IoFilter } from "react-icons/io5";

export default function Example() {
  return (
    <div className="px-4 bg-white/30 flex flex-col min-h-screen text-white">
      {/* Header */}
      <div className="w-full flex justify-start items-center gap-2 mb-2 hover:text-black">
        <h1>Filter</h1>
        <IoFilter />
      </div>

      {/* Scrollable content */}
      <div className="flex flex-col flex-1 gap-2">
        <div className="w-full flex-1 border bg-violet-500/20 p-2">
          AI response
        </div>
        <div className="w-full h-px bg-black"></div>
        <div className="w-full flex-3 border bg-amber-500/20 p-2">
          live text rendering from speech
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full text-xs flex justify-between mt-2">
        <button className="rounded-full py-2 px-6 bg-amber-500">
          Start Listen
        </button>
        <button className="rounded-full bg-violet-700 py-2 px-6">
          Send to AI
        </button>
      </div>

      {/* Shortcut keys */}
      <div className="flex justify-between w-full mt-2">
        <span className="bg-black rounded-2xl px-3 text-xs">
          Shortcut key{" "}
          <span className="bg-gray-500 px-2 rounded-2xl">
            Ctrl + Arrow Left
          </span>
        </span>
        <span className="bg-black rounded-2xl px-3 text-xs">
          Shortcut key{" "}
          <span className="bg-gray-500 px-2 rounded-2xl">
            Ctrl + Arrow Right
          </span>
        </span>
      </div>
    </div>
  );
}
