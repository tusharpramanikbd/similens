import { useState } from 'react'
import type { ScanStatus } from '@renderer/types/scan'
import type { PhotoScanResult } from '@shared/types/photo'

function App(): React.JSX.Element {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle')
  const [scanResult, setScanResult] = useState<PhotoScanResult | null>(null)

  const handleSelectFolder = async (): Promise<void> => {
    const folderPath = await window.similens.selectFolder()

    if (folderPath) {
      setSelectedFolder(folderPath)
      setScanStatus('folder-selected')
      setScanResult(null)
    }
  }

  const handleScanFolder = async (): Promise<void> => {
    if (!selectedFolder) {
      return
    }

    setScanStatus('scanning')

    const result = await window.similens.scanFolder(selectedFolder)

    setScanResult(result)
    setScanStatus('success')
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
        </div>
      )}
    </main>
  )
}

export default App
