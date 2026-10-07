import type { PhotoSimilarity, SimilarityGroup } from '@shared/types/similarity'

type SimilarityLookup = Map<string, Map<string, number>>

/**
 * Builds a bidirectional lookup table for precomputed photo similarities.
 *
 * Each photo path maps to another map containing the similarity scores
 * between that photo and every photo it has been compared with.
 *
 * Both directions are stored so A → B and B → A return the same score.
 */
function createSimilarityLookup(similarities: PhotoSimilarity[]): SimilarityLookup {
  const lookup: SimilarityLookup = new Map()

  // Similarity input is expected to contain at most one score per unordered photo pair.
  for (const { photoA, photoB, similarity } of similarities) {
    if (!lookup.has(photoA)) {
      lookup.set(photoA, new Map())
    }

    if (!lookup.has(photoB)) {
      lookup.set(photoB, new Map())
    }

    lookup.get(photoA)!.set(photoB, similarity)
    lookup.get(photoB)!.set(photoA, similarity)
  }

  return lookup
}

/**
 * Returns similarity pairs in deterministic processing order.
 *
 * Higher similarity scores are placed first. Equal scores are ordered
 * using canonical photo-path pairs so the result does not depend on the
 * original similarities array order.
 */
function sortSimilaritiesForGrouping(similarities: PhotoSimilarity[]): PhotoSimilarity[] {
  return [...similarities].sort((a, b) => {
    const similarityDifference = b.similarity - a.similarity

    if (similarityDifference !== 0) {
      return similarityDifference
    }

    const pairA = [a.photoA, a.photoB].sort().join('\0')

    const pairB = [b.photoA, b.photoB].sort().join('\0')

    return pairA.localeCompare(pairB)
  })
}

/**
 * Creates the initial temporary grouping state.
 *
 * Each photo starts in its own singleton group before any similarity-based
 * merging is performed.
 */
function createInitialGroups(photoPaths: string[]): string[][] {
  return photoPaths.map((photoPath) => [photoPath])
}

function findGroupIndex(groups: string[][], photoPath: string): number {
  return groups.findIndex((group) => group.includes(photoPath))
}

/**
 * Checks whether two photo groups can be merged using complete-link logic.
 *
 * Every photo in one group must meet the similarity threshold against
 * every photo in the other group. A missing similarity score is treated
 * as a failed comparison, so the groups are not merged.
 */
function canGroupsMerge(
  groupA: string[],
  groupB: string[],
  lookup: SimilarityLookup,
  threshold: number
): boolean {
  return groupA.every((photoA) =>
    groupB.every((photoB) => {
      const similarity = lookup.get(photoA)?.get(photoB)

      return similarity !== undefined && similarity >= threshold
    })
  )
}

/**
 * Returns a new grouping state with two groups merged.
 *
 * The merged group is kept at the lower index, while the group at the
 * higher index is removed. The original groups array is left unchanged.
 */
function mergeGroups(groups: string[][], groupAIndex: number, groupBIndex: number): string[][] {
  const firstGroupIndex = Math.min(groupAIndex, groupBIndex)

  const secondGroupIndex = Math.max(groupAIndex, groupBIndex)

  const mergedGroups = [...groups]

  mergedGroups[firstGroupIndex] = [
    ...mergedGroups[firstGroupIndex],
    ...mergedGroups[secondGroupIndex]
  ]

  mergedGroups.splice(secondGroupIndex, 1)

  return mergedGroups
}

/**
 * Returns the grouping state produced by processing eligible similarity pairs.
 *
 * Pairs are expected in strongest-to-weakest order. Processing stops once
 * the similarity score falls below the threshold because all remaining
 * pairs are also below it.
 */
function mergeEligibleGroups(
  groups: string[][],
  sortedSimilarities: PhotoSimilarity[],
  lookup: SimilarityLookup,
  threshold: number
): string[][] {
  let mergedGroups = groups

  for (const { photoA, photoB, similarity } of sortedSimilarities) {
    if (similarity < threshold) {
      break
    }

    const groupAIndex = findGroupIndex(mergedGroups, photoA)

    const groupBIndex = findGroupIndex(mergedGroups, photoB)

    if (groupAIndex === -1 || groupBIndex === -1 || groupAIndex === groupBIndex) {
      continue
    }

    const groupA = mergedGroups[groupAIndex]
    const groupB = mergedGroups[groupBIndex]

    if (!canGroupsMerge(groupA, groupB, lookup, threshold)) {
      continue
    }

    mergedGroups = mergeGroups(mergedGroups, groupAIndex, groupBIndex)
  }

  return mergedGroups
}

/**
 * Excludes singletons and sorts groups and their photo paths before assigning IDs.
 * IDs reflect positions in this result and may change when the group set changes.
 */
function createSimilarityGroups(groups: string[][]): SimilarityGroup[] {
  const normalizedGroups = groups
    .filter((group) => group.length > 1)
    .map((group) => [...group].sort((a, b) => a.localeCompare(b)))
    .sort((groupA, groupB) => groupA[0].localeCompare(groupB[0]))

  return normalizedGroups.map((photos, index) => ({
    id: `group-${index + 1}`,
    photos
  }))
}

/**
 * Groups photos using greedy strongest-pair-first processing and a complete-link merge condition.
 *
 * Photos start as singletons. Precomputed pairs are sorted once and considered
 * from strongest to weakest. Groups merge only when every cross-group pair has
 * a known score at or above the threshold. Singletons are omitted from the result.
 */
export function groupSimilarPhotos(
  photoPaths: string[],
  similarities: PhotoSimilarity[],
  threshold: number
): SimilarityGroup[] {
  const lookup = createSimilarityLookup(similarities)

  const initialGroups = createInitialGroups(photoPaths)

  const sortedSimilarities = sortSimilaritiesForGrouping(similarities)

  const mergedGroups = mergeEligibleGroups(initialGroups, sortedSimilarities, lookup, threshold)

  return createSimilarityGroups(mergedGroups)
}
