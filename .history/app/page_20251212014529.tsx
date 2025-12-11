export default function Home() {
  return (
    <div className="bg-transparent w-full h-full border-2 rounded-full">
      {/* Draggable header */}
      <div className="h-10 w-full [-webkit-app-region:drag]"></div>

      {/* Your main content */}
      <div className="p-4">
        <h1 className="text-white text-lg">My Overlay App</h1>
        <button className="px-3 py-1 bg-red-500 text-white rounded [-webkit-app-region:no-drag]">
          Close
        </button>
      </div>
    </div>
  );
}
