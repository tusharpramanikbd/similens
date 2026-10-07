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

async function loadGroundTruth(): Promise<GroundTruth> {
  const groundTruthPath = join(DATASET_ROOT, 'ground-truth.json')

  const content = await readFile(groundTruthPath, 'utf8')

  return JSON.parse(content) as GroundTruth
}

async function listImageFiles(folderName: string): Promise<string[]> {
  const folderPath = join(DATASET_ROOT, folderName)

  const entries = await readdir(folderPath)

  return entries
    .filter((fileName) => SUPPORTED_IMAGE_EXTENSIONS.has(extname(fileName).toLowerCase()))
    .map((fileName) => join(folderPath, fileName))
}

function matchesExpectedGroups(
  actualGroups: SimilarityGroup[],
  expectedGroups: string[][]
): boolean {
  const normalizeGroups = (groups: string[][]): string[][] =>
    groups
      .map((group) => [...group].sort((a, b) => a.localeCompare(b)))
      .sort((groupA, groupB) => (groupA[0] ?? '').localeCompare(groupB[0] ?? ''))

  const actual = normalizeGroups(actualGroups.map((group) => group.photos))

  const expected = normalizeGroups(expectedGroups)

  return JSON.stringify(actual) === JSON.stringify(expected)
}

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
