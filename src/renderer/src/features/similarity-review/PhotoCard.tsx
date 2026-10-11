interface PhotoCardProps {
  photoPath: string
  thumbnailUrl: string | null | undefined
  isSelected: boolean
  onToggleSelection: (photoPath: string) => void
}

export function PhotoCard({
  photoPath,
  thumbnailUrl,
  isSelected,
  onToggleSelection
}: PhotoCardProps): React.JSX.Element {
  const fileName = photoPath.split(/[\\/]/).pop() || 'Photo'

  return (
    <figure
      className={`overflow-hidden rounded-control border ${
        isSelected ? 'border-brand' : 'border-stroke'
      }`}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={fileName}
          loading="lazy"
          className="h-48 w-full bg-canvas object-contain"
        />
      ) : (
        <div className="flex h-48 items-center justify-center bg-canvas text-sm text-muted">
          Thumbnail unavailable
        </div>
      )}

      <figcaption className="px-3 py-2 text-xs text-muted">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(): void => onToggleSelection(photoPath)}
            className="size-4 accent-brand"
          />

          <span className="min-w-0 flex-1 truncate" title={fileName}>
            {fileName}
          </span>
        </label>
      </figcaption>
    </figure>
  )
}
