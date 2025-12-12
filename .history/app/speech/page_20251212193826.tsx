import { IoFilter } from "react-icons/io5";

export default function () {
  return (
    <div className="p-4 bg-white/30 flex flex-col gap-2 items-center min-h-screen text-white">
      <div className="w-full flex justify-start items-center gap-2 hover:text-black">
        <h1>Filter</h1>
        <IoFilter />
      </div>
      <div className="w-full h-60 border bg-violet-500/20 p-1">AI response</div>
      <div className="w-full h-1 bg-black"></div>
      <div className="w-full h-30 border bg-amber-500/20 p-1">
        live text rendering from speech
      </div>
      <div className="w-full text-xs flex justify-between">
        <button className="rounded-full py-2 px-6 bg-amber-500 ">
          Start Listen
        </button>
        <button className=" rounded-full bg-violet-700 py-2 px-6">
          Send to AI
        </button>
      </div>
      <div className="flex justify-between w-full mt-[-3]">
        <span className=" bg-black rounded-2xl px-3 text-xs">
          Shorcut key{" "}
          <span className="bg-gray-500 px-2 rounded-2xl">Ctrl + Arrow up</span>
        </span>
        <span className=" bg-black rounded-2xl px-3 text-xs">
          Shorcut key{" "}
          <span className="bg-gray-500 px-2 rounded-2xl">Ctrl + Arrow up</span>
        </span>
      </div>
    </div>
  );
}
