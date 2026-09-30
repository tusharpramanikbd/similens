import type { PhotoScanResult } from '@shared/types/photo'

export async function scanPhotoFolder(folderPath: string): Promise<PhotoScanResult> {
  return {
    folderPath,
    photoCount: 0,
    photos: []
  }
}
