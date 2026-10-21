import { useEffect, useRef, useState } from 'react'

import { useAnalysisStageQueue } from '@renderer/hooks/useAnalysisStageQueue'

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

  const isAnalyzingRef = useRef(false)

  const { stage, configureQueue, enqueueStage, waitForCompletion } = useAnalysisStageQueue()

  useEffect(() => {
    return window.similens.onSimilarityProgress(enqueueStage)
  }, [enqueueStage])

  const analyze = async (photoPaths: string[]): Promise<void> => {
    if (isAnalyzingRef.current || photoPaths.length < 2) {
      return
    }

    isAnalyzingRef.current = true
    configureQueue('start')

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

      enqueueStage('finding-similar-groups')
      await waitForCompletion()

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
      configureQueue('stop')
    }
  }

  const reset = (): void => {
    if (isAnalyzingRef.current) {
      return
    }

    configureQueue('stop')

    setStatus('idle')
    setGroups(null)
    setError(null)
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
