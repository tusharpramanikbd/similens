import { useState } from 'react'

import type { SimilarityGroup } from '@shared/types/similarity'
import { usePhotoThumbnails } from '@renderer/hooks/usePhotoThumbnails'
import { usePhotoSelection } from '@renderer/hooks/usePhotoSelection'
import { PhotoCard } from './PhotoCard'
import { PhotoPreview } from './PhotoPreview'
import { Card } from '@renderer/components/ui/Card'

interface SimilarityReviewProps {
  groups: SimilarityGroup[]
}

export function SimilarityReview({ groups }: SimilarityReviewProps): React.JSX.Element {
  const [previewPhotoPath, setPreviewPhotoPath] = useState<string | null>(null)

  const { thumbnailUrls, isLoading, error } = usePhotoThumbnails(groups)
  const { selectedPhotos, togglePhotoSelection } = usePhotoSelection()

  const groupedPhotoCount = groups.reduce((total, group): number => total + group.photos.length, 0)

  return (
    <section>
      <Card className="p-5 sm:p-6">
        <header>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Similar Photos</h2>

          <p className="mt-2 text-sm text-muted">
            Review similar photos side by side and select photos for later action.
          </p>
        </header>

        <div className="mt-5 flex flex-wrap gap-3">
          <div className="rounded-control bg-canvas px-4 py-3">
            <p className="text-xl font-semibold text-foreground">{groups.length}</p>
            <p className="mt-1 text-xs text-muted">Groups</p>
          </div>

          <div className="rounded-control bg-canvas px-4 py-3">
            <p className="text-xl font-semibold text-foreground">{groupedPhotoCount}</p>
            <p className="mt-1 text-xs text-muted">Grouped Photos</p>
          </div>

          <div className="rounded-control bg-brand/10 px-4 py-3">
            <p className="text-xl font-semibold text-brand">{selectedPhotos.size}</p>
            <p className="mt-1 text-xs text-brand">Selected</p>
          </div>
        </div>
      </Card>

      {isLoading && <p>Loading photo thumbnails...</p>}

      {error && <p role="alert">{error}</p>}

      {!isLoading && !error && (
        <div className="mt-6 space-y-6">
          {groups.map((group, index) => (
            <Card key={group.id} className="p-4 sm:p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">Group {index + 1}</h3>

                <span className="rounded-control bg-canvas px-3 py-1.5 text-xs font-medium text-muted">
                  {group.photos.length} photos
                </span>
              </div>

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
            </Card>
          ))}
        </div>
      )}

      <PhotoPreview photoPath={previewPhotoPath} onClose={(): void => setPreviewPhotoPath(null)} />
    </section>
  )
}
