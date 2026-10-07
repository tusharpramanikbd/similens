import { contextBridge, ipcRenderer } from 'electron'
import type { PhotoScanResponse } from '@shared/types/photo'

// The renderer receives named folder operations; filesystem access stays in the main process.
const similensAPI = {
  selectFolder: (): Promise<string | null> => {
    return ipcRenderer.invoke('dialog:select-folder')
  },
  scanFolder: (folderPath: string): Promise<PhotoScanResponse> => {
    return ipcRenderer.invoke('photos:scan-folder', folderPath)
  }
}

contextBridge.exposeInMainWorld('similens', similensAPI)
