import { useEffect, useState } from 'react'

import type { SimilarityGroup } from '@shared/types/similarity'
import type { PhotoThumbnailUrlMap } from '@shared/types/photo'

export interface UsePhotoThumbnailsReturn {
  thumbnailUrls: PhotoThumbnailUrlMap
  isLoading: boolean
  error: string | null
}

interface ThumbnailRequestResult {
  groups: SimilarityGroup[]
  thumbnailUrls: PhotoThumbnailUrlMap
  error: string | null
}

/**
 * Retrieves thumbnail URLs for photos in similarity groups.
 *
 * Only registered photos receive URLs. Results from outdated
 * requests are ignored when the groups change or component unmounts.
 */
export function usePhotoThumbnails(groups: SimilarityGroup[]): UsePhotoThumbnailsReturn {
  const [result, setResult] = useState<ThumbnailRequestResult | null>(null)

  useEffect((): (() => void) => {
    let cancelled = false

    const photoPaths = [...new Set(groups.flatMap((group): string[] => group.photos))]

    if (photoPaths.length > 0) {
      void window.similens
        .getThumbnailUrls(photoPaths)
        .then((urls): void => {
          if (!cancelled) {
            setResult({
              groups,
              thumbnailUrls: urls,
              error: null
            })
          }
        })
        .catch((cause: unknown): void => {
          if (!cancelled) {
            console.error('Failed to retrieve thumbnail URLs:', cause)

            setResult({
              groups,
              thumbnailUrls: {},
              error: 'Unable to load photo thumbnails.'
            })
          }
        })
    }

    return (): void => {
      cancelled = true
    }
  }, [groups])

  const currentResult = result?.groups === groups ? result : null
  const hasPhotos = groups.some((group): boolean => group.photos.length > 0)

  return {
    thumbnailUrls: currentResult?.thumbnailUrls ?? {},
    isLoading: hasPhotos && currentResult === null,
    error: currentResult?.error ?? null
  }
}
