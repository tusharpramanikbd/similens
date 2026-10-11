import type { SimilarityGroup } from '@shared/types/similarity'
import { usePhotoThumbnails } from '@renderer/hooks/usePhotoThumbnails'

interface SimilarityReviewProps {
  groups: SimilarityGroup[]
}

export function SimilarityReview({ groups }: SimilarityReviewProps): React.JSX.Element {
  const { thumbnailUrls, isLoading, error } = usePhotoThumbnails(groups)
  return (
    <section>
      <header>
        <h2>Similar Photos</h2>
        <p>{groups.length} similar photo groups found</p>
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
                {group.photos.map((photoPath) => {
                  const thumbnailUrl = thumbnailUrls[photoPath]
                  const fileName = photoPath.split(/[\\/]/).pop() || 'Photo'

                  return (
                    <figure
                      key={photoPath}
                      className="overflow-hidden rounded-control border border-stroke"
                    >
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={fileName}
                          loading="lazy"
                          className="h-48 w-full bg-canvas object-contain"
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center bg-canvas text-sm text-muted">
                          Thumbnail unavailable
                        </div>
                      )}

                      <figcaption
                        className="truncate px-3 py-2 text-xs text-muted"
                        title={fileName}
                      >
                        {fileName}
                      </figcaption>
                    </figure>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
