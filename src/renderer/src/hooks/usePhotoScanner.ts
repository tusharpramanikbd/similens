import { useRef, useState } from 'react'

import type { ScanStatus } from '@renderer/types/scan'
import type { PhotoScanResult } from '@shared/types/photo'

export interface UsePhotoScannerReturn {
  selectedFolder: string | null
  scanStatus: ScanStatus
  scanResult: PhotoScanResult | null
  scanError: string | null
  selectAndScanFolder: () => Promise<void>
}

export function usePhotoScanner(): UsePhotoScannerReturn {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle')
  const [scanResult, setScanResult] = useState<PhotoScanResult | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)

  const isOperationRunning = useRef(false)

  const selectFolder = async (): Promise<string | null> => {
    const folderPath = await window.similens.selectFolder()

    if (folderPath) {
      setSelectedFolder(folderPath)
    }

    return folderPath
  }

  const scanFolder = async (folderPath: string): Promise<void> => {
    setScanStatus('scanning')
    setScanResult(null)
    setScanError(null)

    const response = await window.similens.scanFolder(folderPath)

    if (!response.success) {
      setScanStatus('error')
      setScanError(response.error)
      return
    }

    setScanResult(response.result)
    setScanStatus('success')
  }

  const selectAndScanFolder = async (): Promise<void> => {
    if (isOperationRunning.current) {
      return
    }

    isOperationRunning.current = true

    try {
      const folderPath = await selectFolder()

      if (!folderPath) {
        return
      }

      await scanFolder(folderPath)
    } catch (error) {
      console.error('Failed to select or scan folder:', error)

      setScanResult(null)
      setScanStatus('error')
      setScanError('Unable to select or scan this folder.')
    } finally {
      isOperationRunning.current = false
    }
  }

  return {
    selectedFolder,
    scanStatus,
    scanResult,
    scanError,
    selectAndScanFolder
  }
}
