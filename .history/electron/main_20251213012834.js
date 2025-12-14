const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const { execFile } = require("child_process");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 520,
    minWidth: 400,
    minHeight: 400,
    titleBarStyle: "hidden",
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    fullscreenable: false,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload/shared.js"), // preload for ipcRenderer
    },
  });

  // macOS-specific
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setContentProtection(true);
  mainWindow.setWindowButtonVisibility?.(false);
  mainWindow.setHiddenInMissionControl?.(true);

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Listen for exit request from renderer
ipcMain.on("close-window", () => {
  if (mainWindow) mainWindow.close();
});

app.whenReady().then(createWindow);

// Handle audio chunks
ipcMain.on("audio-chunk", async (event, chunkBlob) => {
  // Convert Blob to buffer
  const arrayBuffer = await chunkBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const tmpFile = path.join(__dirname, "tmp_chunk.wav");
  await fs.writeFile(tmpFile, buffer);

  // Call Python Whisper script
  execFile(
    "python",
    [path.join(__dirname, "transcribe_chunk.py"), tmpFile],
    (err, stdout) => {
      if (err) {
        console.error(err);
        return;
      }
      event.sender.send("transcription", stdout.trim());
    }
  );
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
