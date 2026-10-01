import { contextBridge, ipcRenderer } from 'electron'
import type { PhotoScanResult } from '@shared/types/photo'

const similensAPI = {
  selectFolder: (): Promise<string | null> => {
    return ipcRenderer.invoke('dialog:select-folder')
  },
  scanFolder: (folderPath: string): Promise<PhotoScanResult> => {
    return ipcRenderer.invoke('photos:scan-folder', folderPath)
  }
}

contextBridge.exposeInMainWorld('similens', similensAPI)
