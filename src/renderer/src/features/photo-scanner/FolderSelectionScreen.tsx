import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'

interface FolderSelectionScreenProps {
  onSelectFolder: () => Promise<void>
}

export function FolderSelectionScreen({
  onSelectFolder
}: FolderSelectionScreenProps): React.JSX.Element {
  const handleSelectFolder = (): void => {
    void onSelectFolder()
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Find Similar Photos</h1>

        <p className="mt-2 text-sm text-muted">
          Find and review similar photos in your local collection.
        </p>
      </header>

      <Card borderStyle="dashed" className="p-8 text-center sm:p-12">
        <h2 className="text-xl font-semibold text-foreground">Select a Photo Folder</h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Choose a folder containing your photos. Similens will automatically scan it for supported
          images.
        </p>

        <Button label="Select Photo Folder" onClick={handleSelectFolder} className="mt-6" />

        <p className="mt-6 text-xs text-muted">Supported formats: JPG, JPEG, PNG, HEIC, WEBP</p>
      </Card>

      <p className="text-center text-sm text-muted">
        Your photos are analyzed locally on your device.
      </p>
    </section>
  )
}
