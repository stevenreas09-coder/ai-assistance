"use client";
import { useState, useRef, useEffect, SyntheticEvent } from "react";
import { IoFilter } from "react-icons/io5";

// Define audio configuration parameters needed for Vosk
const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BUFFER_SIZE: 4096,
};

// 1. Explicitly type all useRef hooks
export default function Example() {
  const [transcript, setTranscript] = useState(
    "Transcript will appear here..."
  );
  const [listening, setListening] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // 2. Explicitly type function parameter 'input'
  const floatTo16BitPCM = (input: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s * 0x7fff, true); // little-endian
    }
    return buffer;
  };

  // 3. Explicitly type function parameter 'ws'
  const startStreaming = async (ws: WebSocket): Promise<void> => {
    try {
      // 1. Get Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Use window.AudioContext directly and avoid 'webkitAudioContext' if possible
      // Using 'as typeof AudioContext' can sometimes help TS infer the correct type
      const AudioCtx = window.AudioContext;
      const audioContext = new AudioCtx({
        sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // 2. Create Audio Processor Node
      const processor = audioContext.createScriptProcessor(
        AUDIO_CONFIG.BUFFER_SIZE,
        AUDIO_CONFIG.CHANNELS,
        AUDIO_CONFIG.CHANNELS
      );
      processorRef.current = processor;

      // 3. Audio Processing & Sending Logic
      // Explicitly type the event argument
      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (ws.readyState === WebSocket.OPEN) {
          // Get raw audio data (Float32Array)
          const audioData = e.inputBuffer.getChannelData(0);

          // Convert to 16-bit PCM buffer
          const pcmData = floatTo16BitPCM(audioData);

          // Send as binary data
          ws.send(pcmData);
        }
      };

      // Connect nodes: Source -> Processor -> Destination
      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log("Audio streaming started.");
    } catch (error) {
      console.error("Failed to start audio stream:", error);
      // Clean up and notify the user
      ws.close();
    }
  };

  const stopStreaming = (): void => {
    // 4. Use optional chaining (?) for safe access to properties and methods
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    // 5. Explicitly type the 'track' parameter
    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track: MediaStreamTrack) => track.stop());
    }
  };

  const toggleListening = (): void => {
    // Use optional chaining for readState and close
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Stop logic
      wsRef.current.close();
      stopStreaming();
      return;
    }

    setConnecting(true);

    const ws = new WebSocket("ws://127.0.0.1:8765");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to Vosk server, starting audio stream.");
      setConnecting(false);
      setListening(true);
      setTranscript("");
      startStreaming(ws);
    };

    // Explicitly type the event argument
    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const type = data.type;
        // Vosk often uses 'partial' key for streaming results
        const newText = data.text || data.partial || "";

        if (!newText) return;

        setTranscript((prev) => {
          const lines = prev.split("\n");
          if (type === "partial") {
            // Replace the last line with the new partial text
            lines[lines.length - 1] = newText;
            return lines.join("\n");
          } else if (type === "final") {
            // Append the final text and start a new line for the next partial
            return prev + "\n" + newText + "\n";
          }
          return prev;
        });
      } catch (e) {
        console.error("Failed to parse WebSocket message:", event.data);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      stopStreaming();
      wsRef.current = null;
      setListening(false);
      setConnecting(false);
    };

    // Explicitly type the error argument
    ws.onerror = (err: Event) => {
      console.error("WebSocket error:", err);
      ws.close();
      setConnecting(false);
      setTranscript("Error: Could not connect to the Vosk server.");
    };
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      stopStreaming();
    };
  }, []);

  // ... (JSX remains the same)
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
      <div className="w-full flex flex-col gap-2 flex-grow">
        <div className="w-full h-60 border font-semibold bg-violet-500/20 p-2">
          AI response
        </div>
        <div className="w-full h-px bg-black"></div>
        <div className="w-full border font-semibold bg-amber-500/20 p-2 min-h-[80px] overflow-y-auto flex-grow whitespace-pre-wrap">
          {transcript}
        </div>
      </div>

      {/* Buttons */}
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
