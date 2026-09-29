import { contextBridge, ipcRenderer } from 'electron'

const similensAPI = {
  selectFolder: (): Promise<string | null> => {
    return ipcRenderer.invoke('dialog:select-folder')
  }
}

contextBridge.exposeInMainWorld('similens', similensAPI)
