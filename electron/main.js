const { app, BrowserWindow, Tray, nativeImage, ipcMain, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const watcher = require("./watcher");

const isDev = !app.isPackaged;
const PORT = isDev ? 3000 : 3847;
const ROOT = path.join(__dirname, "..");

let tray = null;
let popover = null;
let mainWindow = null;
let serverProcess = null;

function createTrayIcon() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, "tray-icon.png")
  );
  icon.setTemplateImage(false);
  return icon;
}

function waitForServer() {
  return new Promise((resolve) => {
    const check = setInterval(() => {
      const req = http.get(`http://localhost:${PORT}`, (res) => {
        if (res.statusCode < 500) {
          clearInterval(check);
          resolve();
        }
        res.resume();
      });
      req.on("error", () => {});
      req.setTimeout(2000, () => req.destroy());
    }, 500);
  });
}

function startServer() {
  if (isDev) return waitForServer();

  return new Promise((resolve, reject) => {
    const resourcesDir = path.join(ROOT, "..");
    const standaloneDir = path.join(resourcesDir, "app.asar.unpacked", ".next", "standalone");
    const standaloneServer = path.join(standaloneDir, "server.js");
    serverProcess = spawn("node", [standaloneServer], {
      cwd: standaloneDir,
      env: { ...process.env, NODE_ENV: "production", PORT: String(PORT), HOSTNAME: "localhost", AUTH_TRUST_HOST: "true" },
      stdio: "pipe",
    });

    serverProcess.stdout.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("Ready") || msg.includes("started")) {
        resolve();
      }
    });

    serverProcess.on("error", reject);

    // Fallback: poll for readiness
    const timeout = setTimeout(() => reject(new Error("Server timeout")), 30000);
    const poll = setInterval(() => {
      const req = http.get(`http://localhost:${PORT}`, (res) => {
        if (res.statusCode < 500) {
          clearInterval(poll);
          clearTimeout(timeout);
          resolve();
        }
        res.resume();
      });
      req.on("error", () => {});
      req.setTimeout(2000, () => req.destroy());
    }, 800);
  });
}

function createPopover() {
  popover = new BrowserWindow({
    width: 320,
    height: 480,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    transparent: true,
    vibrancy: "popover",
    visualEffectState: "active",
    hasShadow: true,
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  popover.loadURL(`http://localhost:${PORT}/tray`);

  popover.on("blur", () => {
    if (popover && popover.isVisible()) {
      popover.hide();
    }
  });
}

function togglePopover() {
  if (!popover || popover.isDestroyed()) {
    createPopover();
  }

  if (popover.isVisible()) {
    popover.hide();
    return;
  }

  // Reload the tray page to get fresh project data
  popover.webContents.reload();

  const trayBounds = tray.getBounds();
  const popoverBounds = popover.getBounds();

  const x = Math.round(
    trayBounds.x + trayBounds.width / 2 - popoverBounds.width / 2
  );
  const y = Math.round(trayBounds.y + trayBounds.height + 4);

  popover.setPosition(x, y, false);
  popover.show();
  popover.focus();
}

function openMainWindow(urlPath = "/") {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadURL(`http://localhost:${PORT}${urlPath}`);
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#ffffff",
    vibrancy: "sidebar",
    visualEffectState: "active",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}${urlPath}`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC handlers
ipcMain.on("open-dashboard", () => {
  if (popover && !popover.isDestroyed()) popover.hide();
  openMainWindow("/");
});

ipcMain.on("open-project", (_, projectId) => {
  if (popover && !popover.isDestroyed()) popover.hide();
  openMainWindow(`/project/${projectId}`);
});

ipcMain.on("open-new-project", () => {
  if (popover && !popover.isDestroyed()) popover.hide();
  openMainWindow("/?new=1");
});

ipcMain.handle("pick-directory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    message: "Select the project folder to track",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// App lifecycle
app.on("ready", async () => {
  if (process.platform === "darwin") {
    app.dock.hide();
  }

  tray = new Tray(createTrayIcon());
  tray.setToolTip("Project Tracker");
  tray.on("click", togglePopover);

  try {
    await startServer();
  } catch (err) {
    console.error("Failed to start server:", err);
    app.quit();
    return;
  }

  createPopover();
  openMainWindow("/");
  watcher.start(PORT);
});

app.on("window-all-closed", (e) => {
  // Don't quit — we live in the tray
});

app.on("before-quit", () => {
  watcher.stop();
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
  }
});
