import { useState } from 'react'

import type { SimilarityGroup } from '@shared/types/similarity'
import { usePhotoThumbnails } from '@renderer/hooks/usePhotoThumbnails'
import { usePhotoSelection } from '@renderer/hooks/usePhotoSelection'
import { PhotoCard } from './PhotoCard'
import { PhotoPreview } from './PhotoPreview'

interface SimilarityReviewProps {
  groups: SimilarityGroup[]
}

export function SimilarityReview({ groups }: SimilarityReviewProps): React.JSX.Element {
  const [previewPhotoPath, setPreviewPhotoPath] = useState<string | null>(null)

  const { thumbnailUrls, isLoading, error } = usePhotoThumbnails(groups)
  const { selectedPhotos, togglePhotoSelection } = usePhotoSelection()

  return (
    <section>
      <header>
        <h2>Similar Photos</h2>
        <p>{groups.length} similar photo groups found</p>
        <p className="mt-1 text-sm text-muted">{selectedPhotos.size} photos selected</p>
      </header>

      {isLoading && <p>Loading photo thumbnails...</p>}

      {error && <p role="alert">{error}</p>}

      {!isLoading && !error && (
        <div className="mt-6 space-y-6">
          {groups.map((group, index) => (
            <section key={group.id} className="rounded-card border border-stroke bg-surface p-4">
              <h3 className="font-semibold text-foreground">Group {index + 1}</h3>

              <p className="mb-4 text-sm text-muted">{group.photos.length} photos</p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.photos.map((photoPath) => (
                  <PhotoCard
                    key={photoPath}
                    photoPath={photoPath}
                    thumbnailUrl={thumbnailUrls[photoPath]}
                    isSelected={selectedPhotos.has(photoPath)}
                    onToggleSelection={togglePhotoSelection}
                    onPreview={setPreviewPhotoPath}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <PhotoPreview photoPath={previewPhotoPath} onClose={(): void => setPreviewPhotoPath(null)} />
    </section>
  )
}
