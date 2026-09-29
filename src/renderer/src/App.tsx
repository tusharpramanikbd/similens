import { useState } from 'react'

function App(): React.JSX.Element {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  const handleSelectFolder = async (): Promise<void> => {
    const folderPath = await window.similens.selectFolder()

    if (folderPath) {
      setSelectedFolder(folderPath)
    }
  }

  return (
    <main>
      <h1>Similens</h1>
      <p>Local AI for smarter photo culling.</p>

      <button type="button" onClick={handleSelectFolder}>
        Select Folder
      </button>

      <p>Selected folder: {selectedFolder ?? 'No folder selected'}</p>
    </main>
  )
}

export default App
