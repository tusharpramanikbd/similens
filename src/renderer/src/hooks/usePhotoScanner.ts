import { useState } from 'react'

import type { ScanStatus } from '@renderer/types/scan'
import type { PhotoScanResult } from '@shared/types/photo'

export interface UsePhotoScannerReturn {
  selectedFolder: string | null
  scanStatus: ScanStatus
  scanResult: PhotoScanResult | null
  scanError: string | null
  selectFolder: () => Promise<void>
  scanFolder: () => Promise<void>
}

export function usePhotoScanner(): UsePhotoScannerReturn {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle')
  const [scanResult, setScanResult] = useState<PhotoScanResult | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)

  const selectFolder = async (): Promise<void> => {
    const folderPath = await window.similens.selectFolder()

    if (folderPath) {
      setSelectedFolder(folderPath)
      setScanStatus('folder-selected')
      setScanResult(null)
      setScanError(null)
    }
  }

  const scanFolder = async (): Promise<void> => {
    if (!selectedFolder) {
      return
    }

    setScanStatus('scanning')
    setScanError(null)
    setScanResult(null)

    const response = await window.similens.scanFolder(selectedFolder)

    if (!response.success) {
      setScanStatus('error')
      setScanError(response.error)
      return
    }

    setScanResult(response.result)
    setScanStatus('success')
  }

  return {
    selectedFolder,
    scanStatus,
    scanResult,
    scanError,
    selectFolder,
    scanFolder
  }
}
