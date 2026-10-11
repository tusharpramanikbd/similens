import { useState } from 'react'

export interface UsePhotoSelectionReturn {
  selectedPhotos: ReadonlySet<string>
  togglePhotoSelection: (photoPath: string) => void
}

export function usePhotoSelection(): UsePhotoSelectionReturn {
  const [selectedPhotos, setSelectedPhotos] = useState<ReadonlySet<string>>(() => new Set<string>())

  const togglePhotoSelection = (photoPath: string): void => {
    setSelectedPhotos((current): ReadonlySet<string> => {
      const updated = new Set(current)

      if (updated.has(photoPath)) {
        updated.delete(photoPath)
      } else {
        updated.add(photoPath)
      }

      return updated
    })
  }

  return {
    selectedPhotos,
    togglePhotoSelection
  }
}
