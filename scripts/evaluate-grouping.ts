import { readFile, readdir } from 'fs/promises'
import { extname, join, relative } from 'path'
import { homedir } from 'os'
import { performance } from 'perf_hooks'

import {
  generateImageEmbedding,
  loadImageFeatureExtractor
} from '@main/services/similarity/imageEmbedding'
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
 * Describes the structure of the evaluation dataset metadata.
 *
 * Positive groups contain photos that are expected to be grouped together.
 * Negative sets contain photos that should remain outside similarity groups.
 */
interface GroundTruth {
  positiveGroups: string[]
  negativeSets: Record<string, string>
}

/**
 * Loads the evaluation dataset ground truth from its JSON metadata file.
 *
 * The JSON file acts as the source of truth for which folders contain
 * positive groups and which folders contain negative evaluation sets.
 */
async function loadGroundTruth(): Promise<GroundTruth> {
  const groundTruthPath = join(DATASET_ROOT, 'ground-truth.json')

  const content = await readFile(groundTruthPath, 'utf8')

  return JSON.parse(content) as GroundTruth
}

/**
 * Supported image paths are collected from one evaluation folder.
 *
 * Files with unsupported extensions are ignored.
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
    const embedding = await generateImageEmbedding(photoPath)

    embeddings.set(photoPath, embedding)
  }

  return embeddings
}

/**
 * Every unique photo pair is converted into a PhotoSimilarity entry
 * using the already-generated embeddings.
 *
 * Each pair is evaluated only once because cosine similarity is symmetric.
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

      const similarity = calculateCosineSimilarity(embeddingA, embeddingB)

      similarities.push({
        photoA,
        photoB,
        similarity
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
 *
 * Group IDs are intentionally ignored because ground truth is concerned
 * with which photos belong together rather than generated group names.
 */
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
  // The dataset structure is loaded from ground-truth.json instead
  // of being duplicated manually inside the evaluation script.
  const groundTruth = await loadGroundTruth()

  // Each positive folder becomes one expected similarity group.
  //
  // Example:
  // positiveGroups = ['group-01', 'group-02']
  //
  // becomes:
  // [
  //   [all group-01 photo paths],
  //   [all group-02 photo paths]
  // ]
  const positiveGroups = await Promise.all(
    groundTruth.positiveGroups.map((folderName) => listImageFiles(folderName))
  )

  // Negative folder names are read dynamically from the ground-truth
  // metadata. These photos participate in the full evaluation but are
  // not expected to produce similarity groups.
  const negativeGroups = await Promise.all(
    Object.values(groundTruth.negativeSets).map((folderName) => listImageFiles(folderName))
  )

  // All positive and negative photos are combined into one collection
  // so cross-folder similarities are also evaluated.
  const photoPaths = [...positiveGroups.flat(), ...negativeGroups.flat()]

  const pipelineStart = performance.now()

  console.log(`Photos: ${photoPaths.length}`)

  console.log('Loading DINOv2 model...')

  const modelLoadStart = performance.now()

  await loadImageFeatureExtractor()

  const modelLoadDuration = performance.now() - modelLoadStart

  console.log(`Model load time: ${modelLoadDuration.toFixed(1)} ms`)

  console.log('Generating DINOv2 embeddings...')

  const embeddingStart = performance.now()

  const embeddings = await generateEmbeddings(photoPaths)

  const embeddingDuration = performance.now() - embeddingStart

  const averageEmbeddingDuration = embeddingDuration / photoPaths.length

  console.log(`Embedding generation time: ${embeddingDuration.toFixed(1)} ms`)

  console.log(`Average embedding time per image: ${averageEmbeddingDuration.toFixed(1)} ms`)

  console.log('Generating pairwise similarities...')

  const similarityStart = performance.now()

  const similarities = generatePairwiseSimilarities(photoPaths, embeddings)

  const similarityDuration = performance.now() - similarityStart

  console.log(`Pairs: ${similarities.length}`)

  console.log(`Pairwise similarity time: ${similarityDuration.toFixed(1)} ms`)

  // The production-style grouping algorithm is evaluated using the
  // currently calibrated DINOv2 similarity threshold.
  const groupingStart = performance.now()

  const groups = groupSimilarPhotos(photoPaths, similarities, SIMILARITY_THRESHOLD)

  const groupingDuration = performance.now() - groupingStart

  const pipelineDuration = performance.now() - pipelineStart

  console.log(`Grouping time: ${groupingDuration.toFixed(1)} ms`)

  console.log(`Total similarity pipeline time: ${pipelineDuration.toFixed(1)} ms`)

  console.log(`\nSimilarity groups at threshold ${SIMILARITY_THRESHOLD}:`)

  for (const group of groups) {
    console.log(`\n${group.id}`)

    for (const photoPath of group.photos) {
      console.log(`  ${relative(DATASET_ROOT, photoPath)}`)
    }
  }

  console.log(`\nTotal groups: ${groups.length}`)

  // The positive folders loaded from ground-truth.json are also the
  // expected output groups. No group names are duplicated manually here.
  const expectedGroups = positiveGroups

  const groundTruthMatches = matchesExpectedGroups(groups, expectedGroups)

  console.log(`Ground-truth grouping match: ${groundTruthMatches}`)

  // A grouping mismatch causes the evaluation command to finish with
  // a failure exit code so regressions can be detected automatically.
  if (!groundTruthMatches) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('Grouping evaluation failed:', error)

  process.exitCode = 1
})
