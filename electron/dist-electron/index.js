"use strict";
const electron = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const node_url = require("node:url");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
const __dirname$1 = path.dirname(node_url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("index.js", document.baseURI).href));
let win = null;
async function createWindow() {
  win = new electron.BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname$1, "../preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });
  win.on("ready-to-show", () => win == null ? void 0 : win.show());
  if (!electron.app.isPackaged) {
    await win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    await win.loadFile(path.join(process.cwd(), "electron/dist/index.html"));
  }
}
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin")
    electron.app.quit();
});
electron.app.whenReady().then(createWindow);
electron.ipcMain.handle("dialog:openCSV", async () => {
  const result = await electron.dialog.showOpenDialog(win, {
    filters: [{ name: "CSV Files", extensions: ["csv"] }],
    properties: ["openFile"]
  });
  if (result.canceled || result.filePaths.length === 0)
    return null;
  return result.filePaths[0];
});
electron.ipcMain.handle("dialog:saveCSV", async () => {
  const result = await electron.dialog.showSaveDialog(win, {
    filters: [{ name: "CSV Files", extensions: ["csv"] }]
  });
  if (result.canceled || !result.filePath)
    return null;
  return result.filePath;
});
electron.ipcMain.handle("fs:readFile", async (_e, filePath, encoding = "utf-8") => {
  const data = await fs.readFile(filePath, { encoding });
  return data;
});
electron.ipcMain.handle("fs:writeFile", async (_e, filePath, data, encoding = "utf-8") => {
  await fs.writeFile(filePath, data, { encoding });
  return true;
});
