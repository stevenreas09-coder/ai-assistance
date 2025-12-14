"use client";
import { useEffect, useState } from "react";

export default function MicrophoneRecorder() {
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    window.electronAPI.onTranscription((text) => {
      setTranscript((prev) => prev + " " + text);
    });

    async function startRecording() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        window.electronAPI.sendAudioChunk(event.data);
      };

      mediaRecorder.start(1500); // 1.5-second chunks
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
