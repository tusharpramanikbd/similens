import { useState } from 'react'

function App(): React.JSX.Element {
  const [selectedFolder] = useState<string | null>(null)

  return (
    <main>
      <h1>Similens</h1>
      <p>Local AI for smarter photo culling.</p>

      <button type="button">Select Folder</button>

      <p>Selected folder: {selectedFolder ?? 'No folder selected'}</p>
    </main>
  )
}

export default App
