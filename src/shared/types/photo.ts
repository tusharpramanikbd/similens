export interface PhotoScanResult {
  folderPath: string
  photoCount: number
  photos: string[]
}

export type PhotoScanResponse =
  | {
      success: true
      result: PhotoScanResult
    }
  | {
      success: false
      error: string
    }
