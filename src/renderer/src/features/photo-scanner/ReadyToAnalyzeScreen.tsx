import type { PhotoScanResult } from '@shared/types/photo'

import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'

interface ReadyToAnalyzeScreenProps {
  scanResult: PhotoScanResult
  onChangeFolder: () => Promise<void>
  onStartAnalysis: () => void
}

export function ReadyToAnalyzeScreen({
  scanResult,
  onChangeFolder,
  onStartAnalysis
}: ReadyToAnalyzeScreenProps): React.JSX.Element {
  const { folderPath, photoCount, photos } = scanResult

  const folderName = folderPath.split(/[\\/]/).filter(Boolean).pop() ?? folderPath

  const imageFormats = Array.from(
    new Set(
      photos.map((photoPath): string => {
        const fileName = photoPath.split(/[\\/]/).pop() ?? ''
        return fileName.split('.').pop()?.toUpperCase() ?? ''
      })
    )
  ).sort()

  const canAnalyze = photoCount >= 2

  const handleChangeFolder = (): void => {
    void onChangeFolder()
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ready to Analyze</h1>

        <p className="mt-2 text-sm text-muted">
          Your selected folder has been scanned successfully.
        </p>
      </header>

      {/* Selected folder */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground">{folderName}</h2>

            <p className="mt-1 break-all text-sm text-muted" title={folderPath}>
              {folderPath}
            </p>
          </div>

          <Button label="Change" onClick={handleChangeFolder} />
        </div>
      </Card>

      {/* Scan summary */}
      <Card className="space-y-5 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Folder Summary</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-control bg-canvas p-4">
            <p className="text-sm text-muted">Photos Found</p>

            <p className="mt-2 text-2xl font-semibold text-foreground">{photoCount}</p>
          </div>

          <div className="rounded-control bg-canvas p-4">
            <p className="text-sm text-muted">Image Formats</p>

            <p className="mt-2 text-sm font-medium text-foreground">
              {imageFormats.length > 0 ? imageFormats.join(', ') : 'None'}
            </p>
          </div>
        </div>

        <div className="rounded-control bg-brand/5 p-4">
          <p className="text-sm font-medium text-foreground">Processing happens on your device</p>

          <p className="mt-1 text-sm leading-6 text-muted">
            Your photos are analyzed locally. They are not uploaded to a server for photo analysis.
          </p>
        </div>

        {!canAnalyze && (
          <p role="status" className="text-sm text-muted">
            At least two supported photos are required for similarity analysis.
          </p>
        )}

        <div className="flex justify-end">
          <Button label="Start Analysis" onClick={onStartAnalysis} disabled={!canAnalyze} />
        </div>
      </Card>
    </section>
  )
}
