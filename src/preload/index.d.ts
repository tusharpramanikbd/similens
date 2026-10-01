import type { PhotoScanResult } from '@shared/types/photo'

export {}

declare global {
  interface Window {
    similens: {
      selectFolder: () => Promise<string | null>,
      scanFolder: (folderPath: string) => Promise<PhotoScanResult>
    }
  }
}
