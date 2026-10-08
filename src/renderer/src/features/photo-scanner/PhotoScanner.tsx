import type { UsePhotoScannerReturn } from '@renderer/hooks/usePhotoScanner'

interface PhotoScannerProps {
  scanner: UsePhotoScannerReturn
}

export function PhotoScanner({ scanner }: PhotoScannerProps): React.JSX.Element {
  const { selectedFolder, scanStatus, scanResult, scanError, selectFolder, scanFolder } = scanner

  return (
    <section>
      <button type="button" onClick={selectFolder}>
        Select Folder
      </button>

      <button
        type="button"
        onClick={scanFolder}
        disabled={!selectedFolder || scanStatus === 'scanning'}
      >
        {scanStatus === 'scanning' ? 'Scanning...' : 'Scan Photos'}
      </button>

      <p>Selected folder: {selectedFolder ?? 'No folder selected'}</p>

      {scanResult && (
        <div>
          {scanResult.photoCount === 0 ? (
            <p>No supported photos found in this folder.</p>
          ) : (
            <p>Photos found: {scanResult.photoCount}</p>
          )}
        </div>
      )}

      {scanStatus === 'error' && scanError && <p role="alert">{scanError}</p>}
    </section>
  )
}
