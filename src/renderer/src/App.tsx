import { SimilarityAnalysis } from '@renderer/features/similarity-analysis/SimilarityAnalysis'
import { PhotoScanner } from '@renderer/features/photo-scanner/PhotoScanner'
import { usePhotoScanner } from '@renderer/hooks/usePhotoScanner'
import { AppLayout } from '@renderer/components/layout/AppLayout'

function App(): React.JSX.Element {
  const scanner = usePhotoScanner()

  return (
    <AppLayout>
      <PhotoScanner scanner={scanner} />

      {scanner.scanResult && scanner.scanResult.photoCount >= 2 && (
        <SimilarityAnalysis photoPaths={scanner.scanResult.photos} />
      )}
    </AppLayout>
  )
}

export default App
