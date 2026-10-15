import { Card } from '@renderer/components/ui/Card'

interface AnalyzingScreenProps {
  photoCount: number
}

export function AnalyzingScreen({ photoCount }: AnalyzingScreenProps): React.JSX.Element {
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
      </Card>
    </section>
  )
}
