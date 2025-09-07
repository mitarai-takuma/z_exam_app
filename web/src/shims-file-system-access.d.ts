// Minimal File System Access API shims for TypeScript
// This enables use of window.showDirectoryPicker and file/directory handles in browsers that support it.

export {}

declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      id?: string
      mode?: 'read' | 'readwrite'
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
    }) => Promise<FileSystemDirectoryHandle>
  }

  interface FileSystemHandle {
    kind: 'file' | 'directory'
    name: string
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    createWritable: (options?: { keepExistingData?: boolean }) => Promise<FileSystemWritableFileStream>
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemDirectoryHandle>
    getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemFileHandle>
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write: (data: string | BufferSource | Blob) => Promise<void>
    close: () => Promise<void>
  }
}
