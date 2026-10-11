interface PhotoCardProps {
  photoPath: string
  thumbnailUrl: string | null | undefined
  isSelected: boolean
  onToggleSelection: (photoPath: string) => void
  onPreview: (photoPath: string) => void
}

export function PhotoCard({
  photoPath,
  thumbnailUrl,
  isSelected,
  onToggleSelection,
  onPreview
}: PhotoCardProps): React.JSX.Element {
  const fileName = photoPath.split(/[\\/]/).pop() || 'Photo'

  return (
    <figure
      className={`overflow-hidden rounded-control border ${
        isSelected ? 'border-brand' : 'border-stroke'
      }`}
    >
      {thumbnailUrl ? (
        <button
          type="button"
          onClick={(): void => onPreview(photoPath)}
          aria-label={`Preview ${fileName}`}
          className="block w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-brand"
        >
          <img
            src={thumbnailUrl}
            alt={fileName}
            loading="lazy"
            className="block h-48 w-full bg-canvas object-contain"
          />
        </button>
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
