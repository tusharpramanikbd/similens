export interface PhotoSimilarity {
  photoA: string
  photoB: string
  similarity: number
}

export interface SimilarityGroup {
  id: string
  photos: string[]
}
