import Link from "next/link";
import { TbCaptureFilled } from "react-icons/tb";
import { LuSpeech } from "react-icons/lu";

export default function Home() {
  return (
    <div className="bg-white-60 w-full h-full ">
      <h1 className="text-center p-4 text-black mt-12 bg-white/80">
        Welcome to AI Asistance
      </h1>
      <div className="w-full flex text-sm justify-center items-start px-4 py-10 gap-4 bg-white/50">
        <Link href="/capture">
          <div className="w-80 border-2 flex justify-between rounded p-2 hover:border-amber-500 hover:bg-amber-500 bg-white/40">
            <div>defination</div>
            <TbCaptureFilled className="w-7 h-7" />
          </div>
        </Link>
        <Link href="/speech">
          <div className="w-80 border-2 flex justify-between rounded hover:border-violet-500  p-2 hover:bg-violet-500 bg-white/40">
            <div>defination</div>
            <LuSpeech className="w-7 h-7" />
          </div>
        </Link>
      </div>
    </div>
  );
}
