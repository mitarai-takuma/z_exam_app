import { contextBridge, ipcRenderer } from 'electron'

export const api = {
  openCSV: () => ipcRenderer.invoke('dialog:openCSV'),
  saveCSV: () => ipcRenderer.invoke('dialog:saveCSV'),
  readFile: (filePath: string, encoding: BufferEncoding = 'utf-8') =>
    ipcRenderer.invoke('fs:readFile', filePath, encoding),
  writeFile: (filePath: string, data: string | Uint8Array, encoding: BufferEncoding = 'utf-8') =>
    ipcRenderer.invoke('fs:writeFile', filePath, data, encoding),
}

declare global {
  interface Window {
    api: typeof api
  }
}

contextBridge.exposeInMainWorld('api', api)
