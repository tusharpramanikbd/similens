/**
 * Calculates cosine similarity between two embedding vectors.
 *
 * The result measures how closely the two vectors point in the same
 * direction. Higher values indicate greater similarity.
 */
export function calculateCosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
  if (embeddingA.length !== embeddingB.length) {
    throw new Error('Embeddings must have the same length')
  }

  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < embeddingA.length; i++) {
    dotProduct += embeddingA[i] * embeddingB[i]
    magnitudeA += embeddingA[i] * embeddingA[i]
    magnitudeB += embeddingB[i] * embeddingB[i]
  }

  const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB)

  if (denominator === 0) {
    throw new Error('Cannot compare zero-magnitude embedding vectors')
  }

  return dotProduct / denominator
}
