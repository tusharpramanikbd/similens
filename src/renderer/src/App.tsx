import { SimilarityAnalysis } from '@renderer/features/similarity-analysis/SimilarityAnalysis'
import { PhotoScanner } from '@renderer/features/photo-scanner/PhotoScanner'
import { usePhotoScanner } from '@renderer/hooks/usePhotoScanner'
import { AppLayout } from '@renderer/components/layout/AppLayout'
import { useSimilarityAnalysis } from '@renderer/hooks/useSimilarityAnalysis'
import { FolderSelectionScreen } from '@renderer/features/photo-scanner/FolderSelectionScreen'
import { ReadyToAnalyzeScreen } from '@renderer/features/photo-scanner/ReadyToAnalyzeScreen'
import { AnalyzingScreen } from '@renderer/features/similarity-analysis/AnalyzingScreen'

function App(): React.JSX.Element {
  const scanner = usePhotoScanner()
  const analysis = useSimilarityAnalysis()

  const handleSelectAndScanFolder = async (): Promise<void> => {
    await scanner.selectAndScanFolder(analysis.reset)
  }

  return (
    <AppLayout>
      {scanner.scanStatus === 'scanning' ? (
        <section className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Scanning Photos</h1>

          <p role="status" className="text-sm text-muted">
            Looking for supported photos in your selected folder...
          </p>
        </section>
      ) : scanner.scanStatus === 'error' ? (
        <PhotoScanner scanner={scanner} />
      ) : scanner.scanResult ? (
        analysis.status === 'idle' ? (
          <ReadyToAnalyzeScreen
            scanResult={scanner.scanResult}
            onChangeFolder={handleSelectAndScanFolder}
            onStartAnalysis={() => {
              void analysis.analyze(scanner.scanResult!.photos)
            }}
          />
        ) : analysis.status === 'analyzing' ? (
          <AnalyzingScreen photoCount={scanner.scanResult.photoCount} />
        ) : (
          <SimilarityAnalysis photoPaths={scanner.scanResult.photos} analysis={analysis} />
        )
      ) : (
        <FolderSelectionScreen onSelectFolder={handleSelectAndScanFolder} />
      )}
    </AppLayout>
  )
}

export default App
