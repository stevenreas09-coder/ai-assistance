import { IoFilter } from "react-icons/io5";
import MicrophoneRecorder from "@/components/MicrophoneRecorder";

export default async function Example() {
  return (
    <div className="px-4 py-2 flex flex-col h-full text-xs text-black">
      {/* Header */}
      <div className="w-full flex justify-start items-center gap-2 mb-2 hover:text-black">
        <h1>Filter</h1>
        <IoFilter />
        <p className="w-1 h-4 border-r-2 border-black"></p>
        <h1>Upload resume</h1>
      </div>

      {/* Parent container with border */}
      <div className="w-full  flex flex-col gap-2">
        <div className="w-full h-60 border font-semibold bg-violet-500/20 p-2">
          AI response
        </div>
        <div className="w-full h-px bg-black"></div>
        <div className="w-full border font-semibold bg-amber-500/20 p-2 min-h-[80px] h-auto">
          <MicrophoneRecorder />
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full text-xs text-white font-semibold flex justify-between mt-2">
        <button className="rounded-full py-2 px-6 bg-amber-500">
          Start Listen
        </button>
        <button className="rounded-full bg-violet-700 py-2 px-6">
          Send to AI
        </button>
      </div>

      {/* Shortcut keys */}
      <div className="flex justify-between text-white w-full mt-2">
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
