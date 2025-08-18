export {}
declare global {
  interface Window {
    api: {
      openCSV(): Promise<string | null>
      saveCSV(): Promise<string | null>
  readFile(filePath: string, encoding?: BufferEncoding): Promise<string>
  writeFile(filePath: string, data: string | Uint8Array, encoding?: BufferEncoding): Promise<boolean>
    }
  }
}
