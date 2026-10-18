import type { PhotoScanResponse, PhotoThumbnailUrlMap } from '@shared/types/photo'
import type { SimilarityAnalysisResponse, SimilarityAnalysisStage } from '@shared/types/similarity'

export {}

declare global {
  interface Window {
    similens: {
      selectFolder: () => Promise<string | null>
      scanFolder: (folderPath: string) => Promise<PhotoScanResponse>
      analyzeSimilarPhotos: (photoPaths: string[]) => Promise<SimilarityAnalysisResponse>
      onSimilarityProgress: (callback: (stage: SimilarityAnalysisStage) => void) => () => void
      getThumbnailUrls: (photoPaths: string[]) => Promise<PhotoThumbnailUrlMap>
      getPreviewUrl: (photoPath: string) => Promise<string | null>
    }
  }
}
