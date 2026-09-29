export {}

declare global {
  interface Window {
    similens: {
      selectFolder: () => Promise<string | null>
    }
  }
}
