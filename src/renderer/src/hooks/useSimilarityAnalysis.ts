import { useEffect, useRef, useState } from 'react'

import type { AnalysisStatus } from '@renderer/types/analysis'
import type { SimilarityAnalysisStage, SimilarityGroup } from '@shared/types/similarity'

export interface UseSimilarityAnalysisReturn {
  status: AnalysisStatus
  groups: SimilarityGroup[] | null
  error: string | null
  stage: SimilarityAnalysisStage | null
  analyze: (photoPaths: string[]) => Promise<void>
  reset: () => void
}

export function useSimilarityAnalysis(): UseSimilarityAnalysisReturn {
  const [status, setStatus] = useState<AnalysisStatus>('idle')
  const [groups, setGroups] = useState<SimilarityGroup[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<SimilarityAnalysisStage | null>(null)

  const isAnalyzingRef = useRef(false)

  useEffect(() => {
    const unsubscribe = window.similens.onSimilarityProgress(
      (nextStage: SimilarityAnalysisStage): void => {
        if (isAnalyzingRef.current) {
          setStage(nextStage)
        }
      }
    )

    return unsubscribe
  }, [])

  const analyze = async (photoPaths: string[]): Promise<void> => {
    if (isAnalyzingRef.current || photoPaths.length < 2) {
      return
    }

    isAnalyzingRef.current = true

    setStatus('analyzing')
    setGroups(null)
    setError(null)
    setStage(null)

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
      setStage(null)
    }
  }

  const reset = (): void => {
    if (isAnalyzingRef.current) {
      return
    }

    setStatus('idle')
    setGroups(null)
    setError(null)
    setStage(null)
  }

  return {
    status,
    stage,
    groups,
    error,
    analyze,
    reset
  }
}
