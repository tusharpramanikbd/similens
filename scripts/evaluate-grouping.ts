import { readdir } from 'fs/promises'
import { extname, join, relative } from 'path'
import { homedir } from 'os'

import { generateImageEmbedding } from '@main/services/similarity/imageEmbedding'
import { calculateCosineSimilarity } from '@main/services/similarity/embeddingSimilarity'
import { groupSimilarPhotos } from '@main/services/similarity/similarityGrouping'
import { SUPPORTED_IMAGE_EXTENSIONS } from '@shared/constants/imageFormats'
import type { PhotoSimilarity, SimilarityGroup } from '@shared/types/similarity'

const DATASET_ROOT = join(
  homedir(),
  'Desktop',
  'Projects',
  'datasets',
  'similens',
  'similarity-evaluation'
)

const SIMILARITY_THRESHOLD = 0.9

/**
 * Supported image paths are collected from one evaluation folder.
 */
async function listImageFiles(folderName: string): Promise<string[]> {
  const folderPath = join(DATASET_ROOT, folderName)
  const entries = await readdir(folderPath)

  return entries
    .filter((fileName) => SUPPORTED_IMAGE_EXTENSIONS.has(extname(fileName).toLowerCase()))
    .map((fileName) => join(folderPath, fileName))
}

/**
 * One DINOv2 embedding is generated for each image and cached
 * for reuse during pairwise similarity calculation.
 */
async function generateEmbeddings(photoPaths: string[]): Promise<Map<string, number[]>> {
  const embeddings = new Map<string, number[]>()

  for (const photoPath of photoPaths) {
    embeddings.set(photoPath, await generateImageEmbedding(photoPath))
  }

  return embeddings
}

/**
 * Every unique photo pair is converted into a PhotoSimilarity entry
 * using the already-generated embeddings.
 */
function generatePairwiseSimilarities(
  photoPaths: string[],
  embeddings: Map<string, number[]>
): PhotoSimilarity[] {
  const similarities: PhotoSimilarity[] = []

  for (let i = 0; i < photoPaths.length; i++) {
    for (let j = i + 1; j < photoPaths.length; j++) {
      const photoA = photoPaths[i]
      const photoB = photoPaths[j]

      const embeddingA = embeddings.get(photoA)
      const embeddingB = embeddings.get(photoB)

      if (!embeddingA || !embeddingB) {
        throw new Error('Missing image embedding')
      }

      similarities.push({
        photoA,
        photoB,
        similarity: calculateCosineSimilarity(embeddingA, embeddingB)
      })
    }
  }

  return similarities
}

/**
 * Compares generated similarity groups with the expected ground-truth groups.
 *
 * Photo paths inside each group and the groups themselves are normalized
 * before comparison so filesystem or input ordering does not affect
 * the validation result.
 */
function matchesExpectedGroups(
  actualGroups: SimilarityGroup[],
  expectedGroups: string[][]
): boolean {
  const normalizeGroups = (groups: string[][]): string[][] =>
    groups
      .map((group) => [...group].sort((a, b) => a.localeCompare(b)))
      .sort((groupA, groupB) => groupA[0].localeCompare(groupB[0]))

  const actual = normalizeGroups(actualGroups.map((group) => group.photos))

  const expected = normalizeGroups(expectedGroups)

  return JSON.stringify(actual) === JSON.stringify(expected)
}

async function main(): Promise<void> {
  const group01 = await listImageFiles('group-01')
  const group02 = await listImageFiles('group-02')
  const samePersonDifferentShots = await listImageFiles('same-person-different-shots')
  const hardNegatives = await listImageFiles('hard-negatives')
  const unrelated = await listImageFiles('unrelated')

  const photoPaths = [
    ...group01,
    ...group02,
    ...samePersonDifferentShots,
    ...hardNegatives,
    ...unrelated
  ]

  console.log(`Photos: ${photoPaths.length}`)
  console.log('Generating DINOv2 embeddings...')

  const embeddings = await generateEmbeddings(photoPaths)

  console.log('Generating pairwise similarities...')

  const similarities = generatePairwiseSimilarities(photoPaths, embeddings)

  console.log(`Pairs: ${similarities.length}`)

  const groups = groupSimilarPhotos(photoPaths, similarities, SIMILARITY_THRESHOLD)

  console.log(`\nSimilarity groups at threshold ${SIMILARITY_THRESHOLD}:`)

  for (const group of groups) {
    console.log(`\n${group.id}`)

    for (const photoPath of group.photos) {
      console.log(`  ${relative(DATASET_ROOT, photoPath)}`)
    }
  }

  console.log(`\nTotal groups: ${groups.length}`)

  const expectedGroups = [group01, group02]

  const groundTruthMatches = matchesExpectedGroups(groups, expectedGroups)

  console.log(`Ground-truth grouping match: ${groundTruthMatches}`)

  if (!groundTruthMatches) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('Grouping evaluation failed:', error)
  process.exitCode = 1
})
