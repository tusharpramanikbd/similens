import { readFile, readdir } from 'fs/promises'
import { extname, join } from 'path'
import { homedir } from 'os'

import { analyzePhotoSimilarity } from '@main/services/similarity/similarityAnalyzer'
import { SUPPORTED_IMAGE_EXTENSIONS } from '@shared/constants/imageFormats'
import type { SimilarityGroup } from '@shared/types/similarity'

const DATASET_ROOT = join(
  homedir(),
  'Desktop',
  'Projects',
  'datasets',
  'similens',
  'similarity-evaluation'
)

interface GroundTruth {
  positiveGroups: string[]
  negativeSets: Record<string, string>
}

/**
 * Loads the evaluation dataset's ground-truth metadata.
 *
 * The JSON file defines the expected positive similarity groups
 * and the negative photo sets used for validation.
 */
async function loadGroundTruth(): Promise<GroundTruth> {
  const groundTruthPath = join(DATASET_ROOT, 'ground-truth.json')

  const content = await readFile(groundTruthPath, 'utf8')

  return JSON.parse(content) as GroundTruth
}

/**
 * Collects supported image files from a specified evaluation folder.
 *
 * Files with unsupported extensions are excluded, and the remaining
 * filenames are converted into absolute file paths.
 */
async function listImageFiles(folderName: string): Promise<string[]> {
  const folderPath = join(DATASET_ROOT, folderName)

  const entries = await readdir(folderPath)

  return entries
    .filter((fileName) => SUPPORTED_IMAGE_EXTENSIONS.has(extname(fileName).toLowerCase()))
    .map((fileName) => join(folderPath, fileName))
}

/**
 * Normalizes photo groups for order-independent comparison.
 *
 * Photo paths are sorted within each group, and groups are then sorted
 * by their first photo path. The original input is not modified.
 */
function normalizeGroups(groups: string[][]): string[][] {
  const normalizedGroups: string[][] = []

  // Sort photo paths within each group.
  for (const group of groups) {
    const sortedPhotos = [...group]

    sortedPhotos.sort((photoA, photoB) => {
      return photoA.localeCompare(photoB)
    })

    normalizedGroups.push(sortedPhotos)
  }

  // Sort groups by their first photo path.
  normalizedGroups.sort((groupA, groupB) => {
    const firstPhotoA = groupA[0] ?? ''
    const firstPhotoB = groupB[0] ?? ''

    return firstPhotoA.localeCompare(firstPhotoB)
  })

  return normalizedGroups
}

/**
 * Compares actual similarity groups with the expected groups.
 *
 * Group IDs are ignored. Both group collections are normalized
 * before comparing their photo memberships.
 */
function matchesExpectedGroups(
  actualGroups: SimilarityGroup[],
  expectedGroups: string[][]
): boolean {
  const actualPhotoGroups: string[][] = actualGroups.map((group) => group.photos)

  const normalizedActual = normalizeGroups(actualPhotoGroups)

  const normalizedExpected = normalizeGroups(expectedGroups)

  const actualJSON = JSON.stringify(normalizedActual)

  const expectedJSON = JSON.stringify(normalizedExpected)

  return actualJSON === expectedJSON
}

/**
 * Runs the production similarity analyzer against the labeled evaluation dataset.
 *
 * Positive and negative photos are analyzed together. The resulting groups
 * are compared with the expected positive groups from the ground truth.
 *
 * A grouping mismatch causes the test process to exit with a failure code.
 */
async function main(): Promise<void> {
  const groundTruth = await loadGroundTruth()

  const positiveGroups = await Promise.all(
    groundTruth.positiveGroups.map((folderName) => listImageFiles(folderName))
  )

  const negativeGroups = await Promise.all(
    Object.values(groundTruth.negativeSets).map((folderName) => listImageFiles(folderName))
  )

  const photoPaths = [...positiveGroups.flat(), ...negativeGroups.flat()]

  console.log(`Photos: ${photoPaths.length}`)
  console.log('Running production similarity analyzer...')

  const groups = await analyzePhotoSimilarity(photoPaths)

  console.log(`Similarity groups: ${groups.length}`)

  const resultsMatch = matchesExpectedGroups(groups, positiveGroups)

  console.log(`Ground-truth match: ${resultsMatch}`)

  if (!resultsMatch) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('Similarity analyzer test failed:', error)

  process.exitCode = 1
})
