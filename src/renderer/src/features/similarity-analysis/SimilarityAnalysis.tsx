import { SimilarityReview } from '@renderer/features/similarity-review/SimilarityReview'
import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'

import type { UseSimilarityAnalysisReturn } from '@renderer/hooks/useSimilarityAnalysis'

interface SimilarityAnalysisProps {
  photoPaths: string[]
  analysis: UseSimilarityAnalysisReturn
}

export function SimilarityAnalysis({
  photoPaths,
  analysis
}: SimilarityAnalysisProps): React.JSX.Element {
  const { status, groups, error, analyze } = analysis

  const handleAnalyzeClick = (): void => {
    void analyze(photoPaths)
  }

  return (
    <section className="mt-8 space-y-6">
      <Card className="mx-auto max-w-3xl p-5 sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Find Similar Photos
        </h2>

        <p className="mt-2 text-sm text-muted">
          Analyze {photoPaths.length} scanned photos to find similar images.
        </p>

        <div className="mt-5">
          <Button
            label={status === 'analyzing' ? 'Analyzing...' : 'Find Similar Photos'}
            onClick={handleAnalyzeClick}
            disabled={status === 'analyzing' || photoPaths.length < 2}
          />
        </div>

        {status === 'analyzing' && (
          <p role="status" className="mt-4 text-sm text-muted">
            Analyzing photos locally. This may take a while...
          </p>
        )}

        {status === 'empty' && (
          <p role="status" className="mt-4 text-sm text-muted">
            No similar photo groups found.
          </p>
        )}

        {status === 'error' && error && (
          <div
            role="alert"
            className="mt-4 rounded-control border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}
      </Card>

      {status === 'success' && groups && <SimilarityReview groups={groups} />}
    </section>
  )
}
