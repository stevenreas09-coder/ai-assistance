"use client";

import { useState, useRef, useEffect } from "react";
import { IoFilter } from "react-icons/io5";

const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
};

export default function Example() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const startStreaming = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: AUDIO_CONFIG.CHANNELS,
          sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
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
      workletNode.connect(audioContext.destination);
    } catch (err) {
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
      setListening(true);
      setConnecting(false);
      startStreaming(ws);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.partial) {
          setTranscript((prev) => {
            const lines = prev.split("\n");
            lines[lines.length - 1] = data.partial;
            return lines.join("\n");
          });
        }
        if (data.text) {
          setTranscript((prev) => prev + data.text + "\n");
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
    <div className="flex flex-col px-4 py-1 text-xs text-black ">
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
        <div className="w-full h-[200px] border font-semibold bg-violet-500/20 p-2">
          AI response
        </div>

        <div className="w-full h-px bg-black"></div>

        {/* Transcript box (scrollable) */}
        <div className="w-full border font-semibold bg-amber-500/20 p-2 overflow-y-auto whitespace-pre-wrap h-[100px] max-h-[150px] min-h-[80px]">
          {transcript}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between text-xs p-1 text-white font-semibold">
        <button
          onClick={toggleListening}
          className={`rounded-full py-2 px-6 ${
            listening ? "bg-red-500" : "bg-amber-500"
          } ${connecting ? "opacity-60 cursor-not-allowed" : ""}`}
          disabled={connecting}
        >
          {connecting
            ? "Connecting..."
            : listening
            ? "Stop Listening"
            : "Start Listening"}
        </button>

        <button className="rounded-full bg-violet-700 py-2 px-6">
          Send to AI
        </button>
      </div>

      {/* Shortcut keys */}
      <div className="flex justify-between text-white w-full mt-1">
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
