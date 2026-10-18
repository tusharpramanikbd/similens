import { calculateCosineSimilarity } from '@main/services/similarity/embeddingSimilarity'
import { generateImageEmbedding } from '@main/services/similarity/imageEmbedding'
import { groupSimilarPhotos } from '@main/services/similarity/similarityGrouping'

import type {
  PhotoSimilarity,
  SimilarityGroup,
  SimilarityAnalysisStage
} from '@shared/types/similarity'

export const DEFAULT_SIMILARITY_THRESHOLD = 0.8

interface PhotoEmbedding {
  photoPath: string
  embedding: number[]
}

interface SimilarityAnalysisOptions {
  threshold?: number
  onProgress?: (stage: SimilarityAnalysisStage) => void
}

/**
 * Analyzes a collection of photos and returns groups of similar images.
 *
 * Each photo is embedded once. The generated embeddings are then reused
 * for all unique pairwise cosine-similarity comparisons before grouping.
 */
export async function analyzePhotoSimilarity(
  photoPaths: string[],
  options: SimilarityAnalysisOptions = {}
): Promise<SimilarityGroup[]> {
  const { threshold = DEFAULT_SIMILARITY_THRESHOLD, onProgress } = options

  if (photoPaths.length < 2) {
    return []
  }

  onProgress?.('generating-embeddings')

  const photoEmbeddings: PhotoEmbedding[] = []

  for (const photoPath of photoPaths) {
    const embedding = await generateImageEmbedding(photoPath)

    photoEmbeddings.push({
      photoPath,
      embedding
    })
  }

  onProgress?.('calculating-similarities')

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

  onProgress?.('finding-similar-groups')

  return groupSimilarPhotos(photoPaths, similarities, threshold)
}
