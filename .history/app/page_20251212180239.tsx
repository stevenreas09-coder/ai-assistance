// pages/index.js
import Card from "../components/Card";
import { TbCaptureFilled } from "react-icons/tb";
import { LuSpeech } from "react-icons/lu";

export default function Home() {
  return (
    <div className="bg-white/60 w-full min-h-screen">
      <h1 className="text-center p-4 text-black mt-12 bg-white/80">
        Welcome to
      </h1>

      <div className="w-full flex text-sm justify-center items-center px-4 py-10 gap-4 flex-wrap bg-white/50">
        <Card
          href="/capture"
          title="Definition"
          Icon={TbCaptureFilled}
          hoverColor="amber-500"
        />

        <Card
          href="/speech"
          title="Speech"
          Icon={LuSpeech}
          hoverColor="violet-500"
        />
      </div>
    </div>
  );
}
