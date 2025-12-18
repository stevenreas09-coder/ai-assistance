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

// Helper to clean up "PDF noise"
const cleanPDFText = (text) => {
  return text
    .replace(/(\w)-\n(\w)/g, "$1$2") // 1. Join words split by hyphens at line breaks
    .replace(/[·•●■]/g, "-") // 2. Standardize bullet points to simple dashes
    .replace(/[^\x20-\x7E\n]/g, "") // 3. Remove non-printable/garbage ASCII characters
    .replace(/[ ]{2,}/g, " ") // 4. Collapse multiple horizontal spaces into one
    .replace(/\n{3,}/g, "\n\n") // 5. Limit excessive consecutive newlines
    .trim();
};

ipcMain.handle("parse-pdf", async (event, arrayBuffer) => {
  try {
    const uint8Array = new Uint8Array(arrayBuffer);
    const loadingTask = pdfjs.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      // Sort by Y (top-to-bottom) then X (left-to-right)
      const items = content.items.map((item) => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
      }));

      items.sort((a, b) => {
        if (Math.abs(a.y - b.y) < 5) return a.x - b.x;
        return b.y - a.y;
      });

      let lastY = items[0]?.y;
      let pageText = "";

      for (const item of items) {
        if (Math.abs(item.y - lastY) > 5) {
          pageText += "\n";
        } else if (pageText !== "") {
          pageText += " ";
        }
        pageText += item.str;
        lastY = item.y;
      }

      fullText += pageText + "\n\n";
    }

    // Apply the post-processor before returning
    return cleanPDFText(fullText);
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
