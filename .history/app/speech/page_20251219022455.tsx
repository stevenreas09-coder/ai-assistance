"use client";
import "../globals.css";
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

  const [selectedOption, setSelectedOption] = useState("interview");

  const [resumeText, setResumeText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null); // To trigger the hidden file input

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: reset input so same file can be re-selected
    e.target.value = "";

    try {
      setLoading(true);
      setFinalTranscript("📄 Reading PDF... please wait.");

      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // 🔹 Send PDF to Electron main process for parsing
      const text: string = await (window as any).electronAPI.parsePDF(
        arrayBuffer
      );

      if (text) {
        // Clean whitespace
        const cleanText = text.replace(/\s+/g, " ").trim();

        setResumeText(cleanText); // store for AI or other logic
        setFinalTranscript(cleanText);
      }
    } catch (error: any) {
      console.error(error);
      setOutput(`❌ ${error.message || "Error reading PDF."}`);
    } finally {
      setLoading(false);
    }
  };

  //------------------------------------------------------------------------------------------
  async function handleSend() {
    if (!transcriptFinal.trim()) return;

    setOutput("");
    setLoading(true);

    // Determine the instruction
    let finalMessage = "";

    // If resumeText exists, use it as the message
    if (resumeText && resumeText.trim() !== "") {
      finalMessage =
        `I am providing my resume below. Please use it to help me answer practice interview questions.\n\n` +
        `### RESUME START ###\n` +
        `${resumeText}\n` +
        `### RESUME END ###\n\n` +
        `Now, based on that resume, can you help me answer this question?`;
    } else {
      // Otherwise, use the selected option logic
      let instruction = selectedOption;

      if (selectedOption === "coding") {
        instruction =
          "Answer this as a web and software developer interview question directly in one or two paragraphs.";
      } else if (selectedOption === "interview") {
        instruction =
          "Answer this interview question directly in two or three paragraphs.";
      }

      finalMessage = `Instruction: ${instruction}\n\nUser Question: "${transcriptFinal}?"`;
    }

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
    setResumeText("");
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
    <div className="flex flex-col h-full px-4 py-2 bg-black/5 text-xs text-white overflow-hidden">
      {/* 1. Header Controls - Fixed height using flex-none */}
      <div className="flex flex-row justify-between items-center gap-2 mb-2 flex-none">
        <div className="flex gap-2">
          <select
            className="bg-zinc-800 text-white rounded border border-white/10 px-1 py-0.5 outline-none focus:border-amber-500"
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
          >
            <option value="interview">Interview</option>
            <option value="coding">Coding</option>
            <option value="translate">Others</option>
          </select>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`border rounded px-2 transition-all active:scale-95 ${
              resumeText
                ? "bg-green-600 border-green-400 text-white font-bold"
                : "bg-white/10 hover:bg-white/20 border-white/10"
            }`}
          >
            {loading
              ? "Parsing..."
              : resumeText
              ? "Resume Loaded ✅"
              : "Upload Resume"}
          </button>
        </div>
        <div className="px-2 py-0.5 bg-black/40 rounded-full text-[10px] text-zinc-400">
          {model || "AI Platform"}
        </div>
      </div>

      {/* 2. Main content area - flex-1 and min-h-0 allows internal scrolling */}
      <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-hidden">
        {/* AI response box - min-h-0 is the secret to making overflow-y-auto work */}
        <div className="h-[180px] shrink-0 flex flex-col rounded-xl border border-white/10 overflow-hidden bg-zinc-900/50">
          <div className="flex-1 w-full rounded-xl border border-white/10 overflow-y-auto whitespace-pre-wrap font-medium bg-zinc-900/80 p-3 shadow-inner custom-scrollbar">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleResumeUpload}
              accept=".pdf"
              className="hidden"
            />
            {output || (
              <span className="text-zinc-500 italic">
                AI response will appear here...
              </span>
            )}
          </div>
        </div>
        {/* Transcript Area - fixed height with h-[140px] and shrink-0 */}
        <div className="h-[140px] shrink-0 flex flex-col rounded-xl border border-white/10 overflow-hidden bg-zinc-900/50">
          {/* Live Interim Results */}
          <div className="h-10 w-full p-2 bg-white/5 italic text-zinc-400 overflow-hidden text-[11px] border-b border-white/5 flex-none">
            {transcript || "Listening..."}
          </div>
          {/* Final Results */}
          <div className="flex-1 w-full p-2 overflow-y-auto text-amber-100/90 custom-scrollbar min-h-0">
            {transcriptFinal}
          </div>
        </div>
      </div>

      {/* 3. Action Buttons - flex-none ensures buttons stay at the bottom */}
      <div className="flex justify-between items-center gap-2 py-3 flex-none">
        <button
          onClick={toggleListening}
          className={`flex-1 rounded-lg border border-white/10 transition-all active:scale-95 py-2.5 font-bold ${
            listening
              ? "bg-red-600 animate-pulse"
              : "bg-amber-600 hover:bg-amber-500"
          } ${connecting ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={connecting}
        >
          {connecting ? "Connecting..." : listening ? "Stop" : "Record"}
        </button>

        <button
          onClick={clearMessage}
          className="px-4 py-2.5 rounded-lg border border-white/10 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all"
        >
          Clear
        </button>

        <button
          className="flex-1 rounded-lg border border-white/10 bg-violet-700 hover:bg-violet-600 active:scale-95 py-2.5 font-bold transition-all disabled:opacity-50"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? "Thinking..." : "Send AI"}
        </button>
      </div>

      {/* 4. Shortcuts Footer - flex-none */}
      <div className="flex justify-between text-[10px] text-zinc-500 pb-1 flex-none">
        <div className="flex gap-1 items-center">
          <kbd className="bg-zinc-800 border border-zinc-700 px-1 rounded text-zinc-300">
            Ctrl
          </kbd>{" "}
          +
          <kbd className="bg-zinc-800 border border-zinc-700 px-1 rounded text-zinc-300">
            ←
          </kbd>
          <span>Record</span>
        </div>
        <div className="flex gap-1 items-center">
          <kbd className="bg-zinc-800 border border-zinc-700 px-1 rounded text-zinc-300">
            Ctrl
          </kbd>{" "}
          +
          <kbd className="bg-zinc-800 border border-zinc-700 px-1 rounded text-zinc-300">
            →
          </kbd>
          <span>Send</span>
        </div>
      </div>
    </div>
  );
}
