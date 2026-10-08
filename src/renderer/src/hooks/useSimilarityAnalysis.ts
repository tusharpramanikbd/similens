import { useRef, useState } from 'react'

import type { AnalysisStatus } from '@renderer/types/analysis'
import type { SimilarityGroup } from '@shared/types/similarity'

interface UseSimilarityAnalysisReturn {
  status: AnalysisStatus
  groups: SimilarityGroup[] | null
  error: string | null
  analyze: (photoPaths: string[]) => Promise<void>
}

export function useSimilarityAnalysis(): UseSimilarityAnalysisReturn {
  const [status, setStatus] = useState<AnalysisStatus>('idle')
  const [groups, setGroups] = useState<SimilarityGroup[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isAnalyzingRef = useRef(false)

  const analyze = async (photoPaths: string[]): Promise<void> => {
    if (isAnalyzingRef.current || photoPaths.length < 2) {
      return
    }

    isAnalyzingRef.current = true

    setStatus('analyzing')
    setGroups(null)
    setError(null)

    try {
      const response = await window.similens.analyzeSimilarPhotos(photoPaths)

      if (!response.success) {
        setError(response.error)
        setStatus('error')
        return
      }

      setGroups(response.groups)

      if (response.groups.length === 0) {
        setStatus('empty')
      } else {
        setStatus('success')
      }
    } catch (error) {
      console.error('Similarity analysis failed:', error)

      setError('Unable to analyze photo similarity.')
      setStatus('error')
    } finally {
      isAnalyzingRef.current = false
    }
  }

  return {
    status,
    groups,
    error,
    analyze
  }
}
