import Image from "next/image";

export default function Home() {
  return (
    <body className="bg-transparent">
      <div className="h-10 w-full [-webkit-app-region:drag]"></div>

      <div className="p-4">
        <h1 className="text-white text-lg">My Overlay App</h1>
        <button className="px-3 py-1 bg-red-500 text-white rounded [-webkit-app-region:no-drag]">
          Close
        </button>
      </div>
    </body>
  );
}
