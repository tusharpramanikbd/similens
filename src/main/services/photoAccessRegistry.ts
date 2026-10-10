import { randomUUID } from 'crypto'

const photoPathsById = new Map<string, string>()
const photoIdsByPath = new Map<string, string>()

/**
 * Registers the photos accessible through the local image protocol.
 *
 * Each unique photo path receives a temporary identifier.
 * Previous registrations are cleared when a new collection is registered.
 */
export function registerAccessiblePhotos(photoPaths: string[]): void {
  photoPathsById.clear()
  photoIdsByPath.clear()

  const uniquePaths = new Set(photoPaths)

  for (const photoPath of uniquePaths) {
    const photoId = randomUUID()

    photoPathsById.set(photoId, photoPath)
    photoIdsByPath.set(photoPath, photoId)
  }
}

/**
 * Resolves a registered photo identifier to its local file path.
 *
 * Unknown identifiers return null.
 */
export function getAccessiblePhotoPath(photoId: string): string | null {
  return photoPathsById.get(photoId) ?? null
}

/**
 * Returns the local thumbnail URL for a registered photo.
 *
 * Unregistered photo paths return null.
 */
export function getPhotoThumbnailUrl(photoPath: string): string | null {
  const photoId = photoIdsByPath.get(photoPath)

  if (!photoId) {
    return null
  }

  return `similens-photo://thumbnail/${photoId}`
}
