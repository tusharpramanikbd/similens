import { useEffect, useRef } from 'react'

import { usePhotoPreview } from '@renderer/hooks/usePhotoPreview'

interface PhotoPreviewProps {
  photoPath: string | null
  onClose: () => void
}

export function PhotoPreview({ photoPath, onClose }: PhotoPreviewProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null)

  const { previewUrl, isLoading, error } = usePhotoPreview(photoPath)

  const fileName = photoPath?.split(/[\\/]/).pop() || 'Photo'

  useEffect((): void => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (photoPath !== null && !dialog.open) {
      dialog.showModal()
    } else if (photoPath === null && dialog.open) {
      dialog.close()
    }
  }, [photoPath])

  const handleCloseClick = (): void => {
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="photo-preview-title"
      className="m-auto max-h-[90vh] w-[90vw] max-w-5xl rounded-card border border-stroke bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/70"
    >
      <div className="flex max-h-[90vh] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-stroke p-4">
          <h2
            id="photo-preview-title"
            className="truncate text-base font-semibold"
            title={fileName}
          >
            {fileName}
          </h2>

          <button
            type="button"
            onClick={handleCloseClick}
            className="rounded-control border border-stroke px-4 py-2 text-sm hover:bg-canvas"
          >
            Close
          </button>
        </header>

        <div className="flex min-h-0 items-center justify-center overflow-auto bg-canvas p-4">
          {isLoading && <p className="text-muted">Loading preview...</p>}

          {!isLoading && error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          {!isLoading && !error && previewUrl && (
            <img
              src={previewUrl}
              alt={`Preview of ${fileName}`}
              className="max-h-[75vh] max-w-full object-contain"
            />
          )}
        </div>
      </div>
    </dialog>
  )
}
