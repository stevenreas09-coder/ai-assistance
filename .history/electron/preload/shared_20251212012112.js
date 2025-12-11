// Preload file, exposes limited API to renderer
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("api", {
  hello: () => console.log("Hello from preload!"),
});
