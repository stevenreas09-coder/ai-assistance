"use client";
import { useState, useRef, useEffect } from "react";
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

  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<string | null>("");

  const [selectedOption, setSelectedOption] = useState(
    "Answer this interview question directly in one or two paragraphs."
  );

  //------------------------------------------------------------------------------------------
  async function handleSend() {
    if (!transcriptFinal.trim()) return;

    setOutput("");
    setLoading(true);

    const finalMessage = `${selectedOption} ${transcriptFinal}?`;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: finalMessage }),
    });
    const modelUsed = res.headers.get("X-Model-Used");
    setModel(modelUsed); // render in UI

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      setOutput((prev) => prev + chunk);
    }

    setLoading(false);
  }
  // ----------------------------------------------------------------------------------
  const startStreaming = async (ws: WebSocket) => {
    try {
      // 🎧 Capture TAB audio ONLY
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: false,
        audio: true, // main.js handler provides loopback
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
  //-----------------------------------------------------------------------------------
  const stopStreaming = () => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;

    audioContextRef.current?.close();
    audioContextRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  };
  //----------------------------------------------------------------------------------
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
  //----------------------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      stopStreaming();
    };
  }, []);
  //-------------------------------------------------------------------------------------
  const clearMessage = () => {
    setFinalTranscript("");
    setTranscript("");
    console.log(`final text clear ${transcriptFinal}`);
  };

  // ⛔ UI BELOW IS 100% UNCHANGED
  return (
    <div className="flex flex-col px-4 py-1 bg-black/20 text-xs rounded-2xl border text-black ">
      {/* Top controls */}
      <div className=" flex flex-row justify-between items-center gap-2">
        <div className="flex gap-2">
          <div>
            <div className="flex gap-2">
              <select
                className="p-0.5 bg-white/50"
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
              >
                <option value="Answer this interview question directly in two or three paragraphs.">
                  interview
                </option>
                <option value="this is junior web and software developer about.can you Answer this interview question directly in one paragraph.">
                  Coding
                </option>
                <option value="translate">others</option>
              </select>
            </div>
          </div>
          <div className="w-1 h-4 border-r-2 border-black"></div>
          <h1>Upload resume</h1>
        </div>
        <div>
          {model && model.length > 0
            ? `Platform provider: ${model}`
            : "AI platform"}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-2 min-h-0">
        {/* AI response box */}
        <div className="w-full h-[200px] border border-black/30 overflow-y-auto whitespace-pre-wrap font-semibold bg-white/20 p-2">
          {output}
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
          className={`rounded-full border hover:bg-white/50 py-2 px-6 ${
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

        <button
          onClick={clearMessage}
          className="rounded-full hover:bg-red-400 border bg-yellow-700/70 py-2 px-6"
        >
          Clear Text
        </button>

        <button
          className="rounded-full hover:bg-white/50 border bg-violet-700/70 py-2 px-6"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? "Thinking..." : "Send to AI"}
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
