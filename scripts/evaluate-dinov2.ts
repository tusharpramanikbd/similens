import { readdir } from 'fs/promises'
import { extname, join } from 'path'
import { homedir } from 'os'

import { SUPPORTED_IMAGE_EXTENSIONS } from '@shared/constants/imageFormats'
import { generateImageEmbedding } from '@main/services/similarity/imageEmbedding'
import { calculateCosineSimilarity } from '@main/services/similarity/embeddingSimilarity'

const DATASET_ROOT = join(
  homedir(),
  'Desktop',
  'Projects',
  'datasets',
  'similens',
  'similarity-evaluation'
)

/**
 * Reads one evaluation folder and returns the full paths
 * of all currently supported image files.
 */
async function listImageFiles(folderName: string): Promise<string[]> {
  const folderPath = join(DATASET_ROOT, folderName)
  const entries = await readdir(folderPath)

  return entries
    .filter((fileName) => {
      const extension = extname(fileName).toLowerCase()

      return SUPPORTED_IMAGE_EXTENSIONS.has(extension)
    })
    .map((fileName) => join(folderPath, fileName))
}

/**
 * Generates one DINOv2 embedding for every image and stores
 * the result by image path so it can be reused for many comparisons.
 */
async function generateEmbeddings(imagePaths: string[]): Promise<Map<string, number[]>> {
  const embeddings = new Map<string, number[]>()

  for (const imagePath of imagePaths) {
    const embedding = await generateImageEmbedding(imagePath)

    embeddings.set(imagePath, embedding)
  }

  return embeddings
}

/**
 * Compares every unique image pair inside one evaluation set
 * using their already-generated DINOv2 embeddings.
 */
function evaluatePairSet(
  setName: string,
  imagePaths: string[],
  embeddings: Map<string, number[]>
): number[] {
  console.log(`\n${setName}`)

  const similarities: number[] = []

  for (let i = 0; i < imagePaths.length; i++) {
    for (let j = i + 1; j < imagePaths.length; j++) {
      const embeddingA = embeddings.get(imagePaths[i])
      const embeddingB = embeddings.get(imagePaths[j])

      if (!embeddingA || !embeddingB) {
        throw new Error('Missing image embedding')
      }

      const similarity = calculateCosineSimilarity(embeddingA, embeddingB)

      similarities.push(similarity)

      console.log(`Pair ${i + 1}-${j + 1}: ${similarity}`)
    }
  }

  return similarities
}

/**
 * Prints basic cosine-similarity statistics for one category.
 */
function printSummary(name: string, similarities: number[]): void {
  const min = Math.min(...similarities)
  const max = Math.max(...similarities)
  const average =
    similarities.reduce((sum, similarity) => sum + similarity, 0) / similarities.length

  console.log(`\n${name} summary`)
  console.log(`Pairs: ${similarities.length}`)
  console.log(`Min: ${min.toFixed(4)}`)
  console.log(`Max: ${max.toFixed(4)}`)
  console.log(`Average: ${average.toFixed(4)}`)
}

/**
 * Evaluates candidate cosine-similarity thresholds against the labeled data.
 *
 * Positive pairs are expected to be classified as similar.
 * Negative pairs are expected to be classified as different.
 */
function evaluateThresholds(positiveSimilarities: number[], negativeSimilarities: number[]): void {
  const thresholds = [0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9]

  console.log('\nThreshold evaluation')

  for (const threshold of thresholds) {
    const truePositives = positiveSimilarities.filter(
      (similarity) => similarity >= threshold
    ).length

    const falseNegatives = positiveSimilarities.length - truePositives

    const falsePositives = negativeSimilarities.filter(
      (similarity) => similarity >= threshold
    ).length

    const trueNegatives = negativeSimilarities.length - falsePositives

    const precision =
      truePositives + falsePositives === 0 ? 0 : truePositives / (truePositives + falsePositives)

    const recall =
      truePositives + falseNegatives === 0 ? 0 : truePositives / (truePositives + falseNegatives)

    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)

    console.log(`\nThreshold: ${threshold}`)
    console.log(`True positives: ${truePositives}`)
    console.log(`False negatives: ${falseNegatives}`)
    console.log(`False positives: ${falsePositives}`)
    console.log(`True negatives: ${trueNegatives}`)

    console.log(`Precision: ${(precision * 100).toFixed(1)}%`)
    console.log(`Recall: ${(recall * 100).toFixed(1)}%`)
    console.log(`F1: ${f1.toFixed(4)}`)
  }
}

function printMisclassifiedPairs(
  threshold: number,
  setName: string,
  imagePaths: string[],
  embeddings: Map<string, number[]>,
  expectedSimilar: boolean
): void {
  for (let i = 0; i < imagePaths.length; i++) {
    for (let j = i + 1; j < imagePaths.length; j++) {
      const embeddingA = embeddings.get(imagePaths[i])
      const embeddingB = embeddings.get(imagePaths[j])

      if (!embeddingA || !embeddingB) {
        throw new Error('Missing image embedding')
      }

      const similarity = calculateCosineSimilarity(embeddingA, embeddingB)

      const predictedSimilar = similarity >= threshold

      if (predictedSimilar !== expectedSimilar) {
        console.log(`${setName}: ${imagePaths[i]} <-> ${imagePaths[j]} = ${similarity.toFixed(4)}`)
      }
    }
  }
}

async function main(): Promise<void> {
  const group01 = await listImageFiles('group-01')
  const group02 = await listImageFiles('group-02')
  const samePersonDifferentShots = await listImageFiles('same-person-different-shots')
  const hardNegatives = await listImageFiles('hard-negatives')
  const unrelated = await listImageFiles('unrelated')

  const allImagePaths = [
    ...group01,
    ...group02,
    ...samePersonDifferentShots,
    ...hardNegatives,
    ...unrelated
  ]

  console.log('Generating DINOv2 embeddings...')

  const embeddings = await generateEmbeddings(allImagePaths)

  // Reported metrics include only within-folder pairs; cross-folder pairs are not evaluated here.
  const group01Similarities = evaluatePairSet('group-01', group01, embeddings)

  const group02Similarities = evaluatePairSet('group-02', group02, embeddings)

  const samePersonDifferentShotsSimilarities = evaluatePairSet(
    'same-person-different-shots',
    samePersonDifferentShots,
    embeddings
  )

  const hardNegativeSimilarities = evaluatePairSet('hard-negatives', hardNegatives, embeddings)

  const unrelatedSimilarities = evaluatePairSet('unrelated', unrelated, embeddings)

  const positiveSimilarities = [...group01Similarities, ...group02Similarities]

  printSummary('Positive', positiveSimilarities)
  printSummary('Same person different shots', samePersonDifferentShotsSimilarities)
  printSummary('Hard negatives', hardNegativeSimilarities)
  printSummary('Unrelated', unrelatedSimilarities)

  const negativeSimilarities = [
    ...samePersonDifferentShotsSimilarities,
    ...hardNegativeSimilarities,
    ...unrelatedSimilarities
  ]

  evaluateThresholds(positiveSimilarities, negativeSimilarities)

  const selectedThreshold = 0.9

  console.log('\nFalse negatives')

  printMisclassifiedPairs(selectedThreshold, 'group-01', group01, embeddings, true)

  printMisclassifiedPairs(selectedThreshold, 'group-02', group02, embeddings, true)

  console.log('\nFalse positives')

  printMisclassifiedPairs(
    selectedThreshold,
    'same-person-different-shots',
    samePersonDifferentShots,
    embeddings,
    false
  )

  printMisclassifiedPairs(selectedThreshold, 'hard-negatives', hardNegatives, embeddings, false)

  printMisclassifiedPairs(selectedThreshold, 'unrelated', unrelated, embeddings, false)
}

main().catch((error) => {
  console.error('DINOv2 evaluation failed:', error)
  process.exitCode = 1
})
