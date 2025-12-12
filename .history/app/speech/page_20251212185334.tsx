import { IoFilter } from "react-icons/io5";

export default function () {
  return (
    <div className="p-4 bg-white/30 flex flex-col gap-2 items-center mt-5 min-h-screen text-white">
      <div className="w-full flex justify-start items-center">
        <h1>Filter</h1>
        <IoFilter />
      </div>
      <div className="w-full h-60 border">ai solution</div>
      <div className="w-full h-1 bg-black"></div>
      <div className="w-full h-30 border">live text rendering from speech</div>
      <button className="w-[50%] rounded-full bg-violet-500 p-2">
        send to ai
      </button>
    </div>
  );
}
