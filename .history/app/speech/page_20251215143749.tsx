"use client";

import { useState, useRef, useEffect } from "react";
import { IoFilter } from "react-icons/io5";

const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
};

export default function Example() {
  const [transcript, setTranscript] = useState("");
  const [transcriptFinal, setFinalTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const startStreaming = async (ws: WebSocket) => {
    try {
      // 🎧 Capture TAB audio ONLY
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: false,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({
        sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
      });
      audioContextRef.current = audioContext;

      await audioContext.audioWorklet.addModule(
        "/audio-worklet/pcm-processor.js"
      );

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(e.data);
        }
      };

      source.connect(workletNode);

      // ❌ DO NOT connect to destination (no playback)
      // workletNode.connect(audioContext.destination);
    } catch (err) {
      console.error("Tab audio capture failed:", err);
      ws.close();
    }
  };

  const stopStreaming = () => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;

    audioContextRef.current?.close();
    audioContextRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  };

  const toggleListening = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setListening(false);
      wsRef.current.close();
      stopStreaming();
      return;
    }

    setConnecting(true);
    const ws = new WebSocket("ws://127.0.0.1:8765");
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({ config: { sample_rate: AUDIO_CONFIG.SAMPLE_RATE } })
      );
      setTranscript("");
      setFinalTranscript("");
      setListening(true);
      setConnecting(false);
      startStreaming(ws);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.partial !== undefined) {
          // partial = single live line
          setTranscript(data.partial);
        }
        if (data.text) {
          // final = append to history
          setFinalTranscript((prev) =>
            prev ? prev + "\n" + data.text : data.text
          );

          // IMPORTANT: clear partial when final arrives
          setTranscript("");
        }
      } catch {}
    };

    ws.onerror = () => {
      setListening(false);
      setConnecting(false);
      ws.close();
    };

    ws.onclose = () => {
      stopStreaming();
      wsRef.current = null;
      setListening(false);
      setConnecting(false);
      setTranscript("");
    };
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      stopStreaming();
    };
  }, []);

  // ⛔ UI BELOW IS 100% UNCHANGED
  return (
    <div className="flex flex-col px-4 py-1 bg-white/50 text-xs text-black ">
      {/* Top controls */}
      <div className="flex items-center gap-2">
        <h1>Filter</h1>
        <IoFilter />
        <div className="w-1 h-4 border-r-2 border-black"></div>
        <h1>Upload resume</h1>
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-2 min-h-0">
        {/* AI response box */}
        <div className="w-full h-[200px] border border-black/30 font-semibold bg-white/20 p-2">
          AI response
        </div>

        <div className="w-full h-px bg-black/50"></div>

        {/* Transcript box (scrollable) */}
        <div className="w-full border border-black/30 font-semibold bg-white/20 h-[150px]">
          <div className="h-[30%]  w-full divide-x-2 p-2 bg-white/50 border overflow-hidden">
            {transcript}
          </div>
          <div className="h-[70%] w-full p-1 overflow-y-auto bg-white/20 border-black/30 border-t ">
            {transcriptFinal}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between text-xs p-1 text-white font-semibold">
        <button
          onClick={toggleListening}
          className={`rounded-full border py-2 px-6 ${
            listening ? "bg-red-500" : "bg-amber-500/70"
          } ${connecting ? "opacity-60 cursor-not-allowed" : ""}`}
          disabled={connecting}
        >
          {connecting
            ? "Connecting..."
            : listening
            ? "Stop Listening"
            : "Start Listening"}
        </button>

        <button className="rounded-full border bg-violet-700/70 py-2 px-6">
          Send to AI
        </button>
      </div>

      {/* Shortcut keys */}
      <div className="flex justify-between text-white w-full mt-1">
        <span className="bg-black/50 rounded-2xl px-3 text-xs">
          Shortcut key{" "}
          <span className="bg-black/50 border px-2 rounded-2xl">
            Ctrl + Arrow Left
          </span>
        </span>
        <span className="bg-black/50 rounded-2xl px-3 text-xs">
          Shortcut key{" "}
          <span className="bg-black/50 border px-2 rounded-2xl">
            Ctrl + Arrow Right
          </span>
        </span>
      </div>
    </div>
  );
}
