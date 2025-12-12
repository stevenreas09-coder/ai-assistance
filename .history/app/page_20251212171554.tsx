import { TbCaptureFilled } from "react-icons/tb";
import { LuSpeech } from "react-icons/lu";

export default function Home() {
  return (
    <div className="bg-white-60 w-full h-full">
      <h1 className="text-center p-4 text-black mt-12 bg-white/80">
        Welcome to AI Asistance
      </h1>
      <span className="px-4 py-4">Select above</span>
      <div className="w-full flex text-sm justify-center items-start px-4 py-10 mt-10 gap-4 bg-white/5">
        <div className="w-80 border-2 flex justify-between rounded p-2 hover:border-amber-500 hover:bg-white/5 bg-white/40">
          <div>defination</div>
          <TbCaptureFilled className="w-7 h-7" />
        </div>
        <div className="w-80 border-2 flex justify-between rounded hover:border-amber-500  p-2 hover:bg-white/5 bg-white/40">
          <div>defination</div>
          <LuSpeech className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
}
