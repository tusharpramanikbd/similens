import type { PhotoSimilarity, SimilarityGroup } from '@shared/types/similarity'

/**
 * Builds a bidirectional lookup table for precomputed photo similarities.
 *
 * Each photo path maps to another map containing the similarity scores
 * between that photo and every photo it has been compared with.
 *
 * Both directions are stored so A → B and B → A return the same score.
 */
function createSimilarityLookup(similarities: PhotoSimilarity[]): Map<string, Map<string, number>> {
  const lookup = new Map<string, Map<string, number>>()

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
 * Checks whether two photo groups can be merged using complete-link logic.
 *
 * Every photo in one group must meet the similarity threshold against
 * every photo in the other group. A missing similarity score is treated
 * as a failed comparison, so the groups are not merged.
 */
function canGroupsMerge(
  groupA: string[],
  groupB: string[],
  lookup: Map<string, Map<string, number>>,
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
 * Groups photos using precomputed pairwise similarity scores.
 *
 * Photos begin as individual groups. Similarity pairs are processed from
 * strongest to weakest. Two groups are merged only when every cross-group
 * photo pair satisfies the similarity threshold, preserving complete-link
 * grouping behavior.
 *
 * Singleton groups are removed from the final result because Similens only
 * needs groups containing at least two similar photos.
 */
export function groupSimilarPhotos(
  photoPaths: string[],
  similarities: PhotoSimilarity[],
  threshold: number
): SimilarityGroup[] {
  // Build a fast bidirectional lookup so any photo pair's similarity
  // can be retrieved without repeatedly searching the similarities array.
  const lookup = createSimilarityLookup(similarities)

  // Start with every photo as its own singleton group.
  //
  // Example:
  // ['A', 'B', 'C']
  // becomes:
  // [['A'], ['B'], ['C']]
  const groups = photoPaths.map((photoPath) => [photoPath])

  // Process the strongest similarity relationships first.
  //
  // When two pairs have exactly the same similarity score, use a
  // canonical photo-path ordering as a deterministic tie-breaker.
  // This prevents the grouping result from depending on the original
  // order of the similarities array.
  const sortedSimilarities = [...similarities].sort((a, b) => {
    const similarityDifference = b.similarity - a.similarity

    if (similarityDifference !== 0) {
      return similarityDifference
    }

    const pairA = [a.photoA, a.photoB].sort().join('\0')
    const pairB = [b.photoA, b.photoB].sort().join('\0')

    return pairA.localeCompare(pairB)
  })

  // Examine each pair from highest similarity to lowest similarity.
  for (const { photoA, photoB, similarity } of sortedSimilarities) {
    // The array is already sorted from strongest to weakest.
    //
    // Once a pair falls below the threshold, every remaining pair
    // will also be below the threshold, so no further pair can
    // trigger a valid merge.
    if (similarity < threshold) {
      break
    }

    // Find the current group containing photoA.
    //
    // Groups change as merges happen, so the current group must
    // be located during each iteration.
    const groupAIndex = groups.findIndex((group) => group.includes(photoA))

    // Find the current group containing photoB.
    const groupBIndex = groups.findIndex((group) => group.includes(photoB))

    // Skip this pair if either photo cannot be found.
    //
    // Also skip if both photos already belong to the same group,
    // because there is nothing left to merge.
    if (groupAIndex === -1 || groupBIndex === -1 || groupAIndex === groupBIndex) {
      continue
    }

    // Get the complete current groups containing the two photos.
    //
    // Example:
    // photoA may belong to [A, B]
    // photoB may belong to [C]
    //
    // The algorithm now considers merging [A, B] with [C],
    // not merely merging A with C.
    const groupA = groups[groupAIndex]
    const groupB = groups[groupBIndex]

    // Apply the complete-link rule.
    //
    // Every photo in groupA must meet the threshold against every
    // photo in groupB. If even one cross-group pair fails,
    // these groups must remain separate.
    if (!canGroupsMerge(groupA, groupB, lookup, threshold)) {
      continue
    }

    // Keep the merged group at the lower array index and remove
    // the group at the higher index.
    //
    // This avoids index-shifting problems when splice() removes
    // one of the groups from the array.
    const firstGroupIndex = Math.min(groupAIndex, groupBIndex)
    const secondGroupIndex = Math.max(groupAIndex, groupBIndex)

    // Combine both groups into one group.
    //
    // Example:
    // [A, B] + [C]
    // becomes:
    // [A, B, C]
    groups[firstGroupIndex] = [...groups[firstGroupIndex], ...groups[secondGroupIndex]]

    // Remove the second group because its photos now belong
    // to the merged group stored at firstGroupIndex.
    groups.splice(secondGroupIndex, 1)
  }

  const normalizedGroups = groups
    // Remove singleton groups because they are not similarity groups.
    .filter((group) => group.length > 1)

    // Sort photo paths inside every group so the member order does not
    // depend on the original photoPaths input order.
    .map((group) => [...group].sort((a, b) => a.localeCompare(b)))

    // Sort the groups themselves using their first photo path.
    // This keeps group ordering and generated group IDs deterministic.
    .sort((groupA, groupB) => groupA[0].localeCompare(groupB[0]))

  return normalizedGroups.map((photos, index) => ({
    id: `group-${index + 1}`,
    photos
  }))
}
