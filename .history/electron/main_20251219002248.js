const {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  session,
} = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const net = require("net");
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

pdfjs.GlobalWorkerOptions.workerSrc = undefined;

let mainWindow;
let pythonProcess;

const VOSK_PORT = 8765;
const PYTHON_SERVER_DIR = path.join(__dirname, "../python_server");

// ✅ venv-safe python
const PYTHON_PATH =
  process.platform === "win32"
    ? path.join(PYTHON_SERVER_DIR, "venv", "Scripts", "python.exe")
    : path.join(PYTHON_SERVER_DIR, "venv", "bin", "python");

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

// ----------------- Start Python -----------------
async function startPython() {
  const free = await isPortFree(VOSK_PORT);
  if (!free) {
    console.error(`Port ${VOSK_PORT} already in use. Aborting Vosk start.`);
    return;
  }

  pythonProcess = spawn(PYTHON_PATH, ["vosk_server.py"], {
    cwd: PYTHON_SERVER_DIR,
    stdio: "inherit",
    windowsHide: true,
  });

  pythonProcess.on("exit", (code, signal) => {
    console.log(`Vosk server exited (code=${code}, signal=${signal})`);
    pythonProcess = null;
  });

  // wait until server binds port
  let retries = 20;
  while (retries-- > 0) {
    const free = await isPortFree(VOSK_PORT);
    if (!free) break;
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log("Vosk server ready");
}

// ----------------- Create Window -----------------
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

  // ⛔ DO NOT TOUCH — REQUIRED WINDOW BEHAVIOR
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setContentProtection(true);
  mainWindow.setWindowButtonVisibility?.(false);
  mainWindow.setHiddenInMissionControl?.(true);

  // Handle getDisplayMedia requests
  session.defaultSession.setDisplayMediaRequestHandler(
    (request, callback) => {
      desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
        // Capture first screen with loopback audio
        callback({ video: sources[0], audio: "loopback" });
      });
    },
    { useSystemPicker: true } // optional
  );

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ----------------- IPC -----------------
ipcMain.on("close-window", () => {
  mainWindow?.close();
});

ipcMain.handle("parse-pdf", async (event, arrayBuffer) => {
  try {
    const uint8Array = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjs.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return fullText.trim();
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(error.message || "Failed to parse PDF");
  }
});

// ----------------- App lifecycle -----------------
app.whenReady().then(async () => {
  await startPython(); // ensure Vosk first
  createWindow();
});

app.on("window-all-closed", () => {
  if (pythonProcess) {
    pythonProcess.kill("SIGTERM"); // graceful
    pythonProcess = null;
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
