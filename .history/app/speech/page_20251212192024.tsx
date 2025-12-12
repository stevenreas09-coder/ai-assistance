import { IoFilter } from "react-icons/io5";

export default function () {
  return (
    <div className="p-4 bg-white/30 flex flex-col gap-2 items-center mt-5 min-h-screen text-white">
      <div className="w-full flex justify-start items-center gap-2 hover:text-black">
        <h1>Filter</h1>
        <IoFilter />
      </div>
      <div className="w-full h-60 border bg-violet-500/20 p-1">AI response</div>
      <div className="w-full h-1 bg-black"></div>
      <div className="w-full h-30 border bg-amber-500/20 p-1">
        live text rendering from speech
      </div>
      <button className="w-[50%] rounded-full bg-violet-700 p-2">
        Send to AI
      </button>
      <span className="mt-[-3] bg-black rounded-2xl px-3 text-xs">
        Shorcut key <span className="bg-gray-900">Ctrl + Arrow up</span>
      </span>
    </div>
  );
}
