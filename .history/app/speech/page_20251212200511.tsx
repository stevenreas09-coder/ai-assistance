import { IoFilter } from "react-icons/io5";

export default function Example() {
  return (
    <div className="flex flex-col h-screen bg-white/30 text-white p-4">
      {/* Header */}
      <div className="flex justify-start items-center gap-2 mb-4">
        <h1>Filter</h1>
        <IoFilter />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 flex flex-col gap-2 scrollbar scrollbar-thumb-gray-500 scrollbar-track-gray-200 p-2">
        <div className="w-full h-60 border bg-violet-500/20 p-1">
          AI response
        </div>
        <div className="w-full h-1 bg-black"></div>
        <div className="w-full h-30 border bg-amber-500/20 p-1">
          live text rendering from speech
        </div>
        <div className="w-full text-xs flex justify-between">
          <button className="rounded-full py-2 px-6 bg-amber-500">
            Start Listen
          </button>
          <button className="rounded-full bg-violet-700 py-2 px-6">
            Send to AI
          </button>
        </div>
        <div className="flex justify-between w-full mt-[-3]">
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
    </div>
  );
}
