"use client";
import { useEffect, useState } from "react";
const { ipcRenderer } = window.require("electron");

export default function MicrophoneRecorder() {
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    // Receive transcription from main process
    ipcRenderer.on("transcription", (event, text) => {
      setTranscript((prev) => prev + " " + text);
    });

    async function startRecording() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        ipcRenderer.send("audio-chunk", event.data); // send chunk to main process
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
