const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  openDashboard: () => ipcRenderer.send("open-dashboard"),
  openProject: (id) => ipcRenderer.send("open-project", id),
  openNewProject: () => ipcRenderer.send("open-new-project"),
});
