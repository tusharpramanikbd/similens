import { readdir } from 'fs/promises'
import { extname, join } from 'path'
import { homedir } from 'os'

import { compareImagesPerceptually } from '@main/services/similarity/perceptualHash'

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

      return ['.jpg', '.jpeg', '.png', '.heic'].includes(extension)
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
 * These values make it easier to compare the positive, hard-negative,
 * and unrelated evaluation sets.
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
 * Runs the complete pHash baseline evaluation.
 *
 * It loads all dataset groups, compares every image pair, combines the
 * three positive groups, and prints summary statistics for each category.
 */
async function main(): Promise<void> {
  const group01 = await listImageFiles('group-01')
  const group02 = await listImageFiles('group-02')
  const group03 = await listImageFiles('group-03')
  const hardNegatives = await listImageFiles('hard-negatives')
  const unrelated = await listImageFiles('unrelated')

  console.log('group-01:', group01.length)
  console.log('group-02:', group02.length)
  console.log('group-03:', group03.length)
  console.log('hard-negatives:', hardNegatives.length)
  console.log('unrelated:', unrelated.length)

  const group01Distances = await evaluatePairSet('group-01', group01)
  const group02Distances = await evaluatePairSet('group-02', group02)
  const group03Distances = await evaluatePairSet('group-03', group03)
  const hardNegativeDistances = await evaluatePairSet('hard-negatives', hardNegatives)
  const unrelatedDistances = await evaluatePairSet('unrelated', unrelated)

  const positiveDistances = [...group01Distances, ...group02Distances, ...group03Distances]

  printSummary('Positive', positiveDistances)
  printSummary('Hard negatives', hardNegativeDistances)
  printSummary('Unrelated', unrelatedDistances)
}

main().catch((error) => {
  console.error('pHash evaluation failed:', error)
  process.exitCode = 1
})
