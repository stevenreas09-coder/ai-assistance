const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  parsePDF: (arrayBuffer) => ipcRenderer.invoke("parse-pdf", arrayBuffer),
  closeWindow: () => ipcRenderer.send("close-window"),
});
