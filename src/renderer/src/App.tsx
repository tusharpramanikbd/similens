import { useState } from 'react'

import type { ScanStatus } from '@renderer/types/scan'
import type { PhotoScanResult } from '@shared/types/photo'
import type { SimilarityGroup } from '@shared/types/similarity'

function App(): React.JSX.Element {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle')
  const [scanResult, setScanResult] = useState<PhotoScanResult | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [similarityGroups, setSimilarityGroups] = useState<SimilarityGroup[] | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const handleSelectFolder = async (): Promise<void> => {
    const folderPath = await window.similens.selectFolder()

    if (folderPath) {
      setSelectedFolder(folderPath)
      setScanStatus('folder-selected')
      setScanResult(null)

      setSimilarityGroups(null)
      setAnalysisError(null)
    }
  }

  const handleScanFolder = async (): Promise<void> => {
    if (!selectedFolder) {
      return
    }

    setScanStatus('scanning')
    setScanError(null)

    const response = await window.similens.scanFolder(selectedFolder)

    if (!response.success) {
      setScanStatus('error')
      setScanError(response.error)
      return
    }

    setScanResult(response.result)
    setScanStatus('success')
  }

  const handleAnalyzeSimilarity = async (): Promise<void> => {
    if (!scanResult || scanResult.photoCount < 2) {
      return
    }

    setIsAnalyzing(true)
    setAnalysisError(null)
    setSimilarityGroups(null)

    const response = await window.similens.analyzeSimilarPhotos(scanResult.photos)

    setIsAnalyzing(false)

    if (!response.success) {
      setAnalysisError(response.error)
      return
    }

    setSimilarityGroups(response.groups)

    console.log('Similarity groups:', response.groups)
  }

  return (
    <main>
      <h1>Similens</h1>
      <p>Local AI for smarter photo culling.</p>

      <button type="button" onClick={handleSelectFolder}>
        Select Folder
      </button>

      <button
        type="button"
        onClick={handleScanFolder}
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

          {scanResult.photoCount >= 2 && (
            <button type="button" onClick={handleAnalyzeSimilarity} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Find Similar Photos'}
            </button>
          )}
          {similarityGroups && <p>Similar photo groups found: {similarityGroups.length}</p>}
          {analysisError && <p>{analysisError}</p>}
        </div>
      )}

      {scanStatus === 'error' && scanError && <p>{scanError}</p>}
    </main>
  )
}

export default App
