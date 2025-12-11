const path = require("path");
const { app, BrowserWindow } = require("electron");

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
      preload: path.join(__dirname, "preload/shared.js"),
    },
  });

  // macOS specific
  if (mainWindow.setHiddenInMissionControl)
    mainWindow.setHiddenInMissionControl(true);
  if (mainWindow.setWindowButtonVisibility)
    mainWindow.setWindowButtonVisibility(false);

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setContentProtection(true); // prevent screen capture

  // Load Next.js app
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
