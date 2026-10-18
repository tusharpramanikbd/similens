import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

import type { PhotoScanResponse, PhotoThumbnailUrlMap } from '@shared/types/photo'
import type { SimilarityAnalysisResponse, SimilarityAnalysisStage } from '@shared/types/similarity'

// The renderer receives named folder operations; filesystem access stays in the main process.
const similensAPI = {
  selectFolder: (): Promise<string | null> => {
    return ipcRenderer.invoke('dialog:select-folder')
  },
  scanFolder: (folderPath: string): Promise<PhotoScanResponse> => {
    return ipcRenderer.invoke('photos:scan-folder', folderPath)
  },
  analyzeSimilarPhotos: (photoPaths: string[]): Promise<SimilarityAnalysisResponse> => {
    return ipcRenderer.invoke('photos:analyze-similarity', photoPaths)
  },
  onSimilarityProgress: (callback: (stage: SimilarityAnalysisStage) => void): (() => void) => {
    const listener = (
      _event: IpcRendererEvent,
      payload: { stage: SimilarityAnalysisStage }
    ): void => {
      callback(payload.stage)
    }

    ipcRenderer.on('photos:similarity-progress', listener)

    return (): void => {
      ipcRenderer.removeListener('photos:similarity-progress', listener)
    }
  },
  getThumbnailUrls: (photoPaths: string[]): Promise<PhotoThumbnailUrlMap> => {
    return ipcRenderer.invoke('photos:get-thumbnail-urls', photoPaths)
  },
  getPreviewUrl: (photoPath: string): Promise<string | null> => {
    return ipcRenderer.invoke('photos:get-preview-url', photoPath)
  }
}

contextBridge.exposeInMainWorld('similens', similensAPI)
