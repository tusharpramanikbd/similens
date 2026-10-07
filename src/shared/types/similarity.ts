export interface PhotoSimilarity {
  photoA: string
  photoB: string
  /** Current embedding cosine similarity; higher is more similar, not a probability. */
  similarity: number
}

export interface SimilarityGroup {
  id: string
  photos: string[]
}
