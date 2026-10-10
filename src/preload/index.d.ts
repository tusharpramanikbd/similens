import type { PhotoScanResponse, PhotoThumbnailUrlMap } from '@shared/types/photo'
import type { SimilarityAnalysisResponse } from '@shared/types/similarity'

export {}

declare global {
  interface Window {
    similens: {
      selectFolder: () => Promise<string | null>
      scanFolder: (folderPath: string) => Promise<PhotoScanResponse>
      analyzeSimilarPhotos: (photoPaths: string[]) => Promise<SimilarityAnalysisResponse>
      getThumbnailUrls: (photoPaths: string[]) => Promise<PhotoThumbnailUrlMap>
    }
  }
}
