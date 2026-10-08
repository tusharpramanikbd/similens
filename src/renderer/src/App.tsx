import { SimilarityAnalysis } from '@renderer/features/similarity-analysis/SimilarityAnalysis'
import { PhotoScanner } from '@renderer/features/photo-scanner/PhotoScanner'
import { usePhotoScanner } from '@renderer/hooks/usePhotoScanner'

function App(): React.JSX.Element {
  const scanner = usePhotoScanner()

  return (
    <main>
      <h1>Similens</h1>
      <p>Local AI for smarter photo culling.</p>

      <PhotoScanner scanner={scanner} />

      {scanner.scanResult && scanner.scanResult.photoCount >= 2 && (
        <SimilarityAnalysis photoPaths={scanner.scanResult.photos} />
      )}
    </main>
  )
}

export default App
