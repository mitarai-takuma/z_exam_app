import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let win: BrowserWindow | null = null

async function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  win.on('ready-to-show', () => win?.show())

  if (!app.isPackaged) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    await win.loadURL(devUrl)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    await win.loadFile(path.join(process.cwd(), 'electron/dist/index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.whenReady().then(createWindow)

// Basic CSV open/save dialogs for UC-006/007
ipcMain.handle('dialog:openCSV', async () => {
  const result = await dialog.showOpenDialog(win!, {
    filters: [{ name: 'CSV Files', extensions: ['csv'] }],
    properties: ['openFile'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('dialog:saveCSV', async () => {
  const result = await dialog.showSaveDialog(win!, {
    filters: [{ name: 'CSV Files', extensions: ['csv'] }],
  })
  if (result.canceled || !result.filePath) return null
  return result.filePath
})

// File system helpers for renderer (CSV import/export)
ipcMain.handle('fs:readFile', async (_e, filePath: string, encoding: BufferEncoding = 'utf-8') => {
  const data = await fs.readFile(filePath, { encoding })
  return data
})

ipcMain.handle('fs:writeFile', async (_e, filePath: string, data: string | Uint8Array, encoding: BufferEncoding = 'utf-8') => {
  await fs.writeFile(filePath, data, { encoding })
  return true
})
