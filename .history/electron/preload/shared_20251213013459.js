const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Keep your existing method
  closeWindow: () => ipcRenderer.send("close-window"),

  // New methods for speech transcription
  sendAudioChunk: (chunk) => ipcRenderer.send("audio-chunk", chunk),
  onTranscription: (callback) =>
    ipcRenderer.on("transcription", (_, text) => callback(text)),
});
