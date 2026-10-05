import { fromRgba } from '@stabilityprotocol.com/phash'

import { decodeImage } from '@main/services/imageDecoder'

/**
 * Generates a perceptual hash for a single image.
 *
 * The image is decoded into raw RGBA pixel data through the shared image
 * decoder, which handles the appropriate decoding strategy for each
 * supported format. The pHash library then converts those pixels into a
 * compact visual fingerprint for image comparison.
 */
export async function generatePerceptualHash(imagePath: string): Promise<string> {
  const image = await decodeImage(imagePath)

  return fromRgba(image.data, image.width, image.height)
}

/**
 * Calculates the Hamming distance between two hexadecimal perceptual hashes.
 *
 * Each hexadecimal character represents four bits. The function compares
 * matching characters with XOR and counts how many individual bits differ.
 *
 * A lower distance means the hashes are more visually similar.
 */
export function comparePerceptualHashes(hashA: string, hashB: string): number {
  if (hashA.length !== hashB.length) {
    throw new Error('Perceptual hashes must have the same length')
  }

  let distance = 0

  for (let i = 0; i < hashA.length; i++) {
    const xor = parseInt(hashA[i], 16) ^ parseInt(hashB[i], 16)

    distance += xor.toString(2).split('1').length - 1
  }

  return distance
}

/**
 * Compares two image files directly using perceptual hashing.
 *
 * A perceptual hash is generated for each image and the Hamming distance
 * between the two hashes is returned.
 */
export async function compareImagesPerceptually(
  imagePathA: string,
  imagePathB: string
): Promise<number> {
  const hashA = await generatePerceptualHash(imagePathA)
  const hashB = await generatePerceptualHash(imagePathB)

  return comparePerceptualHashes(hashA, hashB)
}
