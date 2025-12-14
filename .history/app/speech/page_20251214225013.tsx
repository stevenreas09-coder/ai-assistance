"use client";

import { useState, useRef, useEffect } from "react";
import { IoFilter } from "react-icons/io5";

const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
};

export default function Example() {
  const [transcript, setTranscript] = useState(
    "Transcript will appear here..."
  );
  const [listening, setListening] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const startStreaming = async (ws: WebSocket): Promise<void> => {
    try {
      console.log("Requesting microphone access...");
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

      console.log(
        "AudioContext created, actual sample rate:",
        audioContext.sampleRate
      );

      await audioContext.audioWorklet.addModule(
        "/audio-worklet/pcm-processor.js"
      );
      console.log("AudioWorklet module loaded");

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (e) => {
        console.log(
          "PCM message received from AudioWorklet, bytes:",
          e.data.byteLength
        );
        if (!listening || ws.readyState !== WebSocket.OPEN) return;
        ws.send(e.data); // send PCM to Vosk
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      console.log("Audio streaming started");
    } catch (err) {
      console.error("AudioWorklet start failed:", err);
      ws.close();
    }
  };

  const stopStreaming = (): void => {
    console.log("Stopping streaming...");
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;

    audioContextRef.current?.close();
    audioContextRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;

    console.log("Streaming stopped");
  };

  const toggleListening = (): void => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("Stopping listening...");
      setListening(false);
      wsRef.current.close();
      stopStreaming();
      return;
    }

    console.log("Starting listening...");
    setConnecting(true);

    const ws = new WebSocket("ws://127.0.0.1:8765");
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected to Vosk server");
      ws.send(
        JSON.stringify({ config: { sample_rate: AUDIO_CONFIG.SAMPLE_RATE } })
      );

      setTranscript("");
      setListening(true);
      setConnecting(false);

      startStreaming(ws);
    };

    ws.onmessage = (event: MessageEvent) => {
      console.log("WebSocket message received:", event.data);
      try {
        const data = JSON.parse(event.data);

        if (data.partial) {
          console.log("Partial transcription:", data.partial);
          setTranscript((prev) => {
            const lines = prev.split("\n");
            lines[lines.length - 1] = data.partial;
            return lines.join("\n");
          });
        }

        if (data.text) {
          console.log("Final transcription:", data.text);
          setTranscript((prev) => prev + data.text + "\n");
        }
      } catch (err) {
        console.error("Failed to parse WS message:", event.data, err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setConnecting(false);
      setListening(false);
      ws.close();
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
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
    <div className="px-4 py-2 flex flex-col h-full text-xs text-black">
      <div className="w-full flex justify-start items-center gap-2 mb-2 hover:text-black">
        <h1>Filter</h1>
        <IoFilter />
        <p className="w-1 h-4 border-r-2 border-black"></p>
        <h1>Upload resume</h1>
      </div>

      <div className="w-full flex flex-col gap-2 flex-grow">
        <div className="w-full h-60 border font-semibold bg-violet-500/20 p-2">
          AI response
        </div>
        <div className="w-full h-px bg-black"></div>
        <div className="w-full border font-semibold bg-amber-500/20 p-2 min-h-[80px] overflow-y-auto flex-grow whitespace-pre-wrap">
          {transcript}
        </div>
      </div>

      <div className="w-full text-xs text-white font-semibold flex justify-between mt-2">
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
