import { readdir } from 'fs/promises'
import { extname, join } from 'path'
import { homedir } from 'os'

import { compareImagesPerceptually } from '@main/services/similarity/perceptualHash'
import { SUPPORTED_IMAGE_EXTENSIONS } from '@shared/constants/imageFormats'

const DATASET_ROOT = join(
  homedir(),
  'Desktop',
  'Projects',
  'datasets',
  'similens',
  'similarity-evaluation'
)

/**
 * Reads one evaluation dataset folder and returns the full paths of
 * supported image files.
 *
 * Non-image files such as .DS_Store are ignored.
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
 * Compares every unique pair of images within a dataset group.
 *
 * For n images, each pair is evaluated only once. The function prints
 * each Hamming distance and returns all distances for later analysis.
 */
async function evaluatePairSet(setName: string, imagePaths: string[]): Promise<number[]> {
  console.log(`\n${setName}`)

  const distances: number[] = []

  for (let i = 0; i < imagePaths.length; i++) {
    for (let j = i + 1; j < imagePaths.length; j++) {
      const distance = await compareImagesPerceptually(imagePaths[i], imagePaths[j])

      distances.push(distance)

      console.log(`Pair ${i + 1}-${j + 1}: ${distance}`)
    }
  }

  return distances
}

/**
 * Prints basic statistics for a collection of Hamming distances.
 *
 * These values make it easier to compare the positive and negative
 * evaluation sets.
 */
function printSummary(name: string, distances: number[]): void {
  const min = Math.min(...distances)
  const max = Math.max(...distances)
  const average = distances.reduce((sum, distance) => sum + distance, 0) / distances.length

  console.log(`\n${name} summary`)
  console.log(`Pairs: ${distances.length}`)
  console.log(`Min: ${min}`)
  console.log(`Max: ${max}`)
  console.log(`Average: ${average.toFixed(1)}`)
}

/**
 * Evaluates candidate pHash distance thresholds against the labeled data.
 *
 * Lower Hamming distance means greater visual similarity.
 */
function evaluateThresholds(positiveDistances: number[], negativeDistances: number[]): void {
  const thresholds = [8, 10, 12, 14, 16, 18, 20, 22]

  console.log('\nThreshold evaluation')

  for (const threshold of thresholds) {
    const truePositives = positiveDistances.filter((distance) => distance <= threshold).length

    const falseNegatives = positiveDistances.length - truePositives

    const falsePositives = negativeDistances.filter((distance) => distance <= threshold).length

    const trueNegatives = negativeDistances.length - falsePositives

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

/**
 * Evaluates pHash distances and thresholds using pairs within each labeled folder.
 * Cross-folder pairs are excluded from the reported metrics.
 */
async function main(): Promise<void> {
  const group01 = await listImageFiles('group-01')
  const group02 = await listImageFiles('group-02')
  const samePersonDifferentShots = await listImageFiles('same-person-different-shots')
  const hardNegatives = await listImageFiles('hard-negatives')
  const unrelated = await listImageFiles('unrelated')

  console.log('group-01:', group01.length)
  console.log('group-02:', group02.length)
  console.log('same-person-different-shots:', samePersonDifferentShots.length)
  console.log('hard-negatives:', hardNegatives.length)
  console.log('unrelated:', unrelated.length)

  const group01Distances = await evaluatePairSet('group-01', group01)
  const group02Distances = await evaluatePairSet('group-02', group02)
  const samePersonDifferentShotsDistances = await evaluatePairSet(
    'same-person-different-shots',
    samePersonDifferentShots
  )
  const hardNegativeDistances = await evaluatePairSet('hard-negatives', hardNegatives)
  const unrelatedDistances = await evaluatePairSet('unrelated', unrelated)

  const positiveDistances = [...group01Distances, ...group02Distances]

  printSummary('Positive', positiveDistances)
  printSummary('Same person different shots', samePersonDifferentShotsDistances)
  printSummary('Hard negatives', hardNegativeDistances)
  printSummary('Unrelated', unrelatedDistances)

  const negativeDistances = [
    ...samePersonDifferentShotsDistances,
    ...hardNegativeDistances,
    ...unrelatedDistances
  ]

  evaluateThresholds(positiveDistances, negativeDistances)
}

main().catch((error) => {
  console.error('pHash evaluation failed:', error)
  process.exitCode = 1
})
