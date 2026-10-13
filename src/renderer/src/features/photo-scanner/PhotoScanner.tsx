import type { UsePhotoScannerReturn } from '@renderer/hooks/usePhotoScanner'
import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'

interface PhotoScannerProps {
  scanner: UsePhotoScannerReturn
}

export function PhotoScanner({ scanner }: PhotoScannerProps): React.JSX.Element {
  const { selectedFolder, scanStatus, scanResult, scanError, selectAndScanFolder } = scanner

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      {/* Page heading */}
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Select Photos</h2>

        <p className="mt-2 text-sm text-muted">
          Choose a folder to find and review similar photos.
        </p>
      </header>

      {/* Folder selection */}
      <Card borderStyle="dashed" className="p-6 text-center sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-card bg-brand/10 text-2xl">
          📁
        </div>

        <h3 className="mt-5 text-lg font-semibold text-foreground">Choose a Photo Folder</h3>

        <p className="mt-2 text-sm text-muted">
          Select a folder containing the photos you want to analyze.
        </p>

        <Button
          label={scanStatus === 'scanning' ? 'Scanning...' : 'Browse Folder'}
          onClick={selectAndScanFolder}
          disabled={scanStatus === 'scanning'}
          className="mt-6"
        />

        <p className="mt-5 text-xs text-muted">Supported formats: JPG, JPEG, PNG, HEIC, WEBP</p>
      </Card>

      {/* Selected folder */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground">Selected Folder</h3>

        <p className="mt-2 break-all text-sm text-muted" title={selectedFolder ?? undefined}>
          {selectedFolder ?? 'No folder selected'}
        </p>
      </Card>

      {scanStatus === 'scanning' && (
        <p role="status" className="text-sm text-muted">
          Scanning selected folder...
        </p>
      )}

      {/* Scan results */}
      {scanResult && (
        <div role="status" className="rounded-card border border-stroke bg-surface p-5">
          {scanResult.photoCount === 0 ? (
            <p className="text-sm text-muted">No supported photos found in this folder.</p>
          ) : (
            <p className="text-sm font-medium text-foreground">
              {scanResult.photoCount} photos found
            </p>
          )}
        </div>
      )}

      {/* Scan error */}
      {scanStatus === 'error' && scanError && (
        <div
          role="alert"
          className="rounded-control border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {scanError}
        </div>
      )}
    </section>
  )
}
