import { join } from 'path'
import { homedir } from 'os'

import {
  generateImageEmbedding,
  loadImageFeatureExtractor
} from '@main/services/similarity/imageEmbedding'
import { calculateCosineSimilarity } from '@main/services/similarity/embeddingSimilarity'

async function main(): Promise<void> {
  console.log('Loading DINOv2 model...')

  await loadImageFeatureExtractor()

  console.log('DINOv2 model loaded successfully.')

  const testImagePathA = join(
    homedir(),
    'Desktop',
    'Projects',
    'datasets',
    'similens',
    'similarity-evaluation',
    'unrelated',
    '1.jpeg'
  )

  const testImagePathB = join(
    homedir(),
    'Desktop',
    'Projects',
    'datasets',
    'similens',
    'similarity-evaluation',
    'unrelated',
    '2.jpeg'
  )

  const embeddingA = await generateImageEmbedding(testImagePathA)
  const embeddingB = await generateImageEmbedding(testImagePathB)

  const similarity = calculateCosineSimilarity(embeddingA, embeddingB)

  console.log('Embedding A length:', embeddingA.length)
  console.log('Embedding B length:', embeddingB.length)
  console.log('Cosine similarity:', similarity)
}

main().catch((error) => {
  console.error('DINOv2 test failed:', error)
  process.exitCode = 1
})
