import Link from "next/link";
import { TbCaptureFilled } from "react-icons/tb";
import { LuSpeech } from "react-icons/lu";

export default function Home() {
  return (
    <div className="bg-white/60 w-full min-h-[50vh]">
      <h1 className="text-center p-4 text-black mt-12 bg-white/80">
        Welcome to
      </h1>

      <div className="w-full flex text-sm justify-center items-center px-4 py-10 gap-4 bg-white/50 flex-wrap">
        {/* Capture Card */}
        <Link
          href="/capture"
          className="w-80 border-2 flex justify-between items-center rounded p-2 hover:border-amber-500 hover:bg-amber-500 bg-white/40 transition-colors duration-200"
        >
          <div>definition</div>
          <TbCaptureFilled className="w-7 h-7" />
        </Link>

        {/* Speech Card */}
        <Link
          href="/speech"
          className="w-80 border-2 flex justify-between items-center rounded p-2 hover:border-violet-500 hover:bg-violet-500 bg-white/40 transition-colors duration-200"
        >
          <div>definition</div>
          <LuSpeech className="w-7 h-7" />
        </Link>
      </div>
    </div>
  );
}
