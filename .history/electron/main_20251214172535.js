const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn, exec } = require("child_process");
const net = require("net");

let mainWindow;
let pythonProcess;

// ----------------- Port check -----------------
function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () =>
        tester.once("close", () => resolve(true)).close()
      )
      .listen(port);
  });
}

// ----------------- Kill process on port -----------------
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    // Windows command to get PID using the port
    exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
      if (err || !stdout) return resolve(false);

      const lines = stdout.split("\n").filter(Boolean);
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid) {
          console.log(`Killing process ${pid} using port ${port}`);
          exec(`taskkill /PID ${pid} /F`, () => {});
        }
      });
      resolve(true);
    });
  });
}

// ----------------- Start Python -----------------
async function startPython() {
  const free = await isPortFree(8765);
  if (!free) {
    await killProcessOnPort(8765);
  }

  pythonProcess = spawn("python", ["vosk_server.py"], {
    cwd: path.join(__dirname, "../python_server"),
    stdio: "inherit",
    shell: true,
    windowsHide: true,
  });

  pythonProcess.on("exit", (code) => {
    console.log(`Vosk server exited with code ${code}`);
  });

  // Wait until port 8765 is ready
  let retries = 20;
  while (retries > 0) {
    const isFree = await isPortFree(8765);
    if (!isFree) break; // port in use → server is ready
    await new Promise((r) => setTimeout(r, 250));
    retries--;
  }

  console.log("Vosk server is ready, Electron can connect now.");
}

// -----------------------------------------------

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
      preload: path.join(__dirname, "preload/shared.js"),
    },
  });

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

ipcMain.on("close-window", () => {
  if (mainWindow) mainWindow.close();
});

app.whenReady().then(() => {
  createWindow();
  startPython();
});

app.on("window-all-closed", () => {
  if (pythonProcess) pythonProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
