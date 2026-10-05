import { join } from 'path'
import { homedir } from 'os'

import {
  generateImageEmbedding,
  loadImageFeatureExtractor
} from '@main/services/similarity/imageEmbedding'

async function main(): Promise<void> {
  console.log('Loading DINOv2 model...')

  await loadImageFeatureExtractor()

  console.log('DINOv2 model loaded successfully.')

  const testImagePath = join(
    homedir(),
    'Desktop',
    'Projects',
    'datasets',
    'similens',
    'similarity-evaluation',
    'unrelated',
    'nature.heic'
  )

  const embeddingA = await generateImageEmbedding(testImagePath)
  const embeddingB = await generateImageEmbedding(testImagePath)

  const embeddingsMatch = embeddingA.every((value, index) => value === embeddingB[index])

  console.log('Embedding length:', embeddingA.length)
  console.log('First 5 values:', embeddingA.slice(0, 5))
  console.log('Repeated embedding matches:', embeddingsMatch)
}

main().catch((error) => {
  console.error('DINOv2 test failed:', error)
  process.exitCode = 1
})
