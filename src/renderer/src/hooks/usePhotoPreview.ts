import { useEffect, useState } from 'react'

interface PhotoPreviewResult {
  photoPath: string
  previewUrl: string | null
  error: string | null
}

export interface UsePhotoPreviewReturn {
  previewUrl: string | null
  isLoading: boolean
  error: string | null
}

/**
 * Retrieves the higher-resolution preview URL for a selected photo.
 *
 * Results from outdated requests are ignored when the selected
 * photo changes or the component unmounts.
 */
export function usePhotoPreview(photoPath: string | null): UsePhotoPreviewReturn {
  const [result, setResult] = useState<PhotoPreviewResult | null>(null)

  useEffect((): (() => void) => {
    let cancelled = false

    if (photoPath !== null) {
      void window.similens
        .getPreviewUrl(photoPath)
        .then((url): void => {
          if (!cancelled) {
            setResult({
              photoPath,
              previewUrl: url,
              error: url ? null : 'Preview unavailable for this photo.'
            })
          }
        })
        .catch((cause: unknown): void => {
          if (!cancelled) {
            console.error('Failed to retrieve photo preview URL:', cause)

            setResult({
              photoPath,
              previewUrl: null,
              error: 'Unable to load photo preview.'
            })
          }
        })
    }

    return (): void => {
      cancelled = true
    }
  }, [photoPath])

  const currentResult = result?.photoPath === photoPath ? result : null

  return {
    previewUrl: currentResult?.previewUrl ?? null,
    isLoading: photoPath !== null && currentResult === null,
    error: currentResult?.error ?? null
  }
}
