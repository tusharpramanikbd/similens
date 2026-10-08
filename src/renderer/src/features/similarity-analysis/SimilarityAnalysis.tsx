import { useSimilarityAnalysis } from '@renderer/hooks/useSimilarityAnalysis'

interface SimilarityAnalysisProps {
  photoPaths: string[]
}

export function SimilarityAnalysis({ photoPaths }: SimilarityAnalysisProps): React.JSX.Element {
  const { status, groups, error, analyze } = useSimilarityAnalysis()

  const handleAnalyzeClick = (): void => {
    void analyze(photoPaths)
  }

  return (
    <section>
      <button
        type="button"
        onClick={handleAnalyzeClick}
        disabled={status === 'analyzing' || photoPaths.length < 2}
      >
        {status === 'analyzing' ? 'Analyzing...' : 'Find Similar Photos'}
      </button>

      {status === 'analyzing' && <p>Analyzing photos locally...</p>}

      {status === 'success' && groups && <p>Similar photo groups found: {groups.length}</p>}

      {status === 'empty' && <p>No similar photo groups found.</p>}

      {status === 'error' && error && <p role="alert">{error}</p>}
    </section>
  )
}
