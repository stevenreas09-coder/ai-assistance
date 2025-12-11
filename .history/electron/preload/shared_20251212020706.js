const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  exitApp: () => ipcRenderer.send("exit-app"),
  doSomething: () => ipcRenderer.invoke("do-something"),
});
