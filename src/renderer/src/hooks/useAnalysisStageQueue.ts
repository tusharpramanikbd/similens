import { useCallback, useEffect, useRef, useState } from 'react'

import type { SimilarityAnalysisStage } from '@shared/types/similarity'

const MIN_STAGE_DISPLAY_MS = 1000

const ANALYSIS_STAGES: SimilarityAnalysisStage[] = [
  'generating-embeddings',
  'calculating-similarities',
  'finding-similar-groups'
]

export interface UseAnalysisStageQueueReturn {
  stage: SimilarityAnalysisStage | null
  configureQueue: (action: 'start' | 'stop') => void
  enqueueStage: (stage: SimilarityAnalysisStage) => void
  waitForCompletion: () => Promise<void>
}

export function useAnalysisStageQueue(): UseAnalysisStageQueueReturn {
  const [stage, setStage] = useState<SimilarityAnalysisStage | null>(null)

  const stageQueueRef = useRef<Promise<void>>(Promise.resolve())
  const lastQueuedStageRef = useRef(-1)
  const runIdRef = useRef(0)
  const isActiveRef = useRef(false)

  const configureQueue = useCallback((action: 'start' | 'stop'): void => {
    runIdRef.current += 1
    isActiveRef.current = action === 'start'
    stageQueueRef.current = Promise.resolve()
    lastQueuedStageRef.current = -1

    setStage(null)
  }, [])

  const enqueueStage = useCallback((nextStage: SimilarityAnalysisStage): void => {
    const nextIndex = ANALYSIS_STAGES.indexOf(nextStage)

    if (!isActiveRef.current || nextIndex === -1 || nextIndex <= lastQueuedStageRef.current) {
      return
    }

    const runId = runIdRef.current

    for (let index = lastQueuedStageRef.current + 1; index <= nextIndex; index++) {
      const stageToShow = ANALYSIS_STAGES[index]

      stageQueueRef.current = stageQueueRef.current.then(async (): Promise<void> => {
        if (!isActiveRef.current || runId !== runIdRef.current) {
          return
        }

        setStage(stageToShow)

        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, MIN_STAGE_DISPLAY_MS)
        })
      })
    }

    lastQueuedStageRef.current = nextIndex
  }, [])

  const waitForCompletion = useCallback(async (): Promise<void> => {
    await stageQueueRef.current
  }, [])

  useEffect(() => {
    return (): void => {
      runIdRef.current += 1
      isActiveRef.current = false
    }
  }, [])

  return {
    stage,
    configureQueue,
    enqueueStage,
    waitForCompletion
  }
}
