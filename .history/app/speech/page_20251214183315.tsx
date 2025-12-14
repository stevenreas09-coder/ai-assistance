"use client";
import { useState, useRef } from "react";
import { IoFilter } from "react-icons/io5";

export default function Example() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const toggleListening = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      // Don't immediately setListening(false), wait for onclose
      return;
    }

    // Start a new WebSocket connection
    const ws = new WebSocket("ws://127.0.0.1:8765");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to Vosk server");
      setListening(true); // set listening only when connection is open
      setTranscript(""); // clear previous transcript
    };

    ws.onmessage = (event) => {
      // Directly append the raw text from Python
      const text = event.data;
      if (!text) return;

      setTranscript((prev) => {
        const lines = prev.split("\n");
        lines.push(text);
        if (lines.length > 50) lines.shift();
        return lines.join("\n");
      });
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      wsRef.current = null;
      setListening(false); // now toggle button back
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws.close();
    };
  };

  return (
    <div className="px-4 py-2 flex flex-col h-full text-xs text-black">
      {/* Header */}
      <div className="w-full flex justify-start items-center gap-2 mb-2 hover:text-black">
        <h1>Filter</h1>
        <IoFilter />
        <p className="w-1 h-4 border-r-2 border-black"></p>
        <h1>Upload resume</h1>
      </div>

      {/* Parent container with border */}
      <div className="w-full flex flex-col gap-2">
        <div className="w-full h-60 border font-semibold bg-violet-500/20 p-2">
          AI response
        </div>
        <div className="w-full h-px bg-black"></div>
        <div className="w-full border font-semibold bg-amber-500/20 p-2 min-h-[80px] h-auto">
          {transcript}
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full text-xs text-white font-semibold flex justify-between mt-2">
        <button
          onClick={toggleListening}
          className="rounded-full py-2 px-6 bg-amber-500"
        >
          {listening ? "Stop Listening" : "Start Listening"}
        </button>
        <button className="rounded-full bg-violet-700 py-2 px-6">
          Send to AI
        </button>
      </div>

      {/* Shortcut keys */}
      <div className="flex justify-between text-white w-full mt-2">
        <span className="bg-black rounded-2xl px-3 text-xs">
          Shortcut key{" "}
          <span className="bg-gray-500 px-2 rounded-2xl">
            Ctrl + Arrow Left
          </span>
        </span>
        <span className="bg-black rounded-2xl px-3 text-xs">
          Shortcut key{" "}
          <span className="bg-gray-500 px-2 rounded-2xl">
            Ctrl + Arrow Right
          </span>
        </span>
      </div>
    </div>
  );
}
