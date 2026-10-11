import { useState } from 'react'

interface PhotoPreviewImageProps {
  src: string
  fileName: string
}

type ImageStatus = 'loading' | 'loaded' | 'error'

export function PhotoPreviewImage({ src, fileName }: PhotoPreviewImageProps): React.JSX.Element {
  const [status, setStatus] = useState<ImageStatus>('loading')

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center">
      {status === 'loading' && (
        <p role="status" className="text-sm text-muted">
          Loading image...
        </p>
      )}

      {status === 'error' && (
        <p role="alert" className="text-sm text-red-600">
          Unable to load preview image.
        </p>
      )}

      <img
        src={src}
        alt={`Preview of ${fileName}`}
        onLoad={(): void => setStatus('loaded')}
        onError={(): void => setStatus('error')}
        className={`h-full w-full object-contain ${status === 'loaded' ? 'block' : 'hidden'}`}
      />
    </div>
  )
}
