import Link from "next/link";
import { TbCaptureFilled } from "react-icons/tb";
import { LuSpeech } from "react-icons/lu";

export default function Home() {
  return (
    <div className="w-full h-full text-black flex flex-col">
      {/* Header text with slight top padding */}
      <h1 className="text-center pt-6 pb-2 text-xl font-semibold">
        Welcome to <span className="text-amber-600">reas</span>
      </h1>

      {/* Using flex-col instead of wrap to ensure they stack nicely 
         within your fixed 520px height window.
      */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 gap-4">
        {/* Capture Card */}
        <Link
          href="/capture"
          className="w-full max-w-xs border-2 border-black/5 flex justify-between items-center rounded-lg p-4 
                     hover:border-amber-500 hover:bg-amber-500 hover:text-white 
                     bg-white/40 transition-all duration-200 active:scale-95 group"
        >
          <div className="flex flex-col">
            <span className="font-bold">Capture</span>
            <span className="text-xs opacity-70">Define screen areas</span>
          </div>
          <TbCaptureFilled className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        </Link>

        {/* Speech Card */}
        <Link
          href="/speech"
          className="w-full max-w-xs border-2 border-black/5 flex justify-between items-center rounded-lg p-4 
                     hover:border-violet-500 hover:bg-violet-500 hover:text-white 
                     bg-white/40 transition-all duration-200 active:scale-95 group"
        >
          <div className="flex flex-col">
            <span className="font-bold">Speech</span>
            <span className="text-xs opacity-70">Voice settings</span>
          </div>
          <LuSpeech className="w-8 h-8 group-hover:-rotate-12 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
