import { calculateCosineSimilarity } from '@main/services/similarity/embeddingSimilarity'
import { generateImageEmbedding } from '@main/services/similarity/imageEmbedding'
import { groupSimilarPhotos } from '@main/services/similarity/similarityGrouping'

import type { PhotoSimilarity, SimilarityGroup } from '@shared/types/similarity'

export const DEFAULT_SIMILARITY_THRESHOLD = 0.9

interface PhotoEmbedding {
  photoPath: string
  embedding: number[]
}

/**
 * Analyzes a collection of photos and returns groups of similar images.
 *
 * Each photo is embedded once. The generated embeddings are then reused
 * for all unique pairwise cosine-similarity comparisons before grouping.
 */
export async function analyzePhotoSimilarity(
  photoPaths: string[],
  threshold = DEFAULT_SIMILARITY_THRESHOLD
): Promise<SimilarityGroup[]> {
  if (photoPaths.length < 2) {
    return []
  }

  const photoEmbeddings: PhotoEmbedding[] = []

  for (const photoPath of photoPaths) {
    const embedding = await generateImageEmbedding(photoPath)

    photoEmbeddings.push({
      photoPath,
      embedding
    })
  }

  const similarities: PhotoSimilarity[] = []

  for (let i = 0; i < photoEmbeddings.length; i++) {
    const photoA = photoEmbeddings[i]

    for (let j = i + 1; j < photoEmbeddings.length; j++) {
      const photoB = photoEmbeddings[j]

      similarities.push({
        photoA: photoA.photoPath,
        photoB: photoB.photoPath,
        similarity: calculateCosineSimilarity(photoA.embedding, photoB.embedding)
      })
    }
  }

  return groupSimilarPhotos(photoPaths, similarities, threshold)
}
