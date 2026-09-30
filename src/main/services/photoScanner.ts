import { readdir } from 'fs/promises'
import { extname, join } from 'path'
import type { PhotoScanResult } from '@shared/types/photo'

const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.heic'])

async function getFilesRecursively(directoryPath: string): Promise<string[]> {
  const entries = await readdir(directoryPath, {
    withFileTypes: true
  })

  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(directoryPath, entry.name)

    if (entry.isDirectory()) {
      const nestedFiles = await getFilesRecursively(fullPath)
      files.push(...nestedFiles)
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

function isSupportedImage(filePath: string): boolean {
  const extension = extname(filePath).toLowerCase()

  return SUPPORTED_IMAGE_EXTENSIONS.has(extension)
}

export async function scanPhotoFolder(folderPath: string): Promise<PhotoScanResult> {
  const files = await getFilesRecursively(folderPath)

  const photos = files.filter(isSupportedImage)

  return {
    folderPath,
    photoCount: photos.length,
    photos
  }
}
