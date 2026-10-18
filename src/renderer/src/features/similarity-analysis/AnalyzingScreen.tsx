import { Card } from '@renderer/components/ui/Card'

import type { SimilarityAnalysisStage } from '@shared/types/similarity'

interface AnalyzingScreenProps {
  photoCount: number
  stage: SimilarityAnalysisStage | null
}

const ANALYSIS_STAGES: {
  id: SimilarityAnalysisStage
  label: string
}[] = [
  {
    id: 'generating-embeddings',
    label: 'Generating image embeddings'
  },
  {
    id: 'calculating-similarities',
    label: 'Calculating similarities'
  },
  {
    id: 'finding-similar-groups',
    label: 'Finding similar groups'
  }
]

export function AnalyzingScreen({ photoCount, stage }: AnalyzingScreenProps): React.JSX.Element {
  const currentStageIndex = ANALYSIS_STAGES.findIndex((item) => item.id === stage)

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analyzing Photos</h1>

        <p className="mt-2 text-sm text-muted">
          Similens is finding similar photos in your collection.
        </p>
      </header>

      <Card className="p-8 text-center sm:p-12">
        <div
          aria-hidden="true"
          className="mx-auto size-12 animate-spin rounded-full border-4 border-stroke border-t-brand"
        />

        <h2 className="mt-6 text-lg font-semibold text-foreground">
          Analyzing {photoCount} photos
        </h2>

        <p role="status" className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Processing your photos locally. This may take a while depending on the size of your
          collection.
        </p>

        <ul aria-label="Analysis progress" className="mx-auto mt-8 max-w-md space-y-3 text-left">
          {ANALYSIS_STAGES.map((item, index) => {
            const isCompleted = index < currentStageIndex
            const isActive = index === currentStageIndex

            return (
              <li
                key={item.id}
                className={`flex items-center gap-3 rounded-control p-3 ${
                  isActive ? 'bg-brand/5 text-brand' : 'text-muted'
                }`}
              >
                <span aria-hidden="true" className="w-5 text-center text-lg">
                  {isCompleted ? '✓' : isActive ? '●' : '○'}
                </span>

                <span className="text-sm font-medium">{item.label}</span>

                <span className="sr-only">
                  {isCompleted ? 'Completed' : isActive ? 'In progress' : 'Pending'}
                </span>
              </li>
            )
          })}
        </ul>
      </Card>
    </section>
  )
}
