"use client";
import { useEffect, useState } from "react";

export default function MicrophoneRecorder() {
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    console.log("electronAPI:", window.electronAPI);
    window.electronAPI.onTranscription((text) => {
      setTranscript((prev) => prev + " " + text);
    });

    async function startRecording() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = async (event) => {
        const blob = event.data;

        // Convert BLOB → ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();

        // Convert ArrayBuffer → Uint8Array (safe for IPC)
        const uint8 = new Uint8Array(arrayBuffer);

        // Send to Electron main
        window.electronAPI.sendAudioChunk(uint8);
      };

      mediaRecorder.start(1500); // 1.5 second chunks
    }

    startRecording();
  }, []);

  return (
    <div>
      <h2>Recording… Speak now!</h2>
      <p>
        <strong>Transcription:</strong> {transcript}
      </p>
    </div>
  );
}
