import sharp from 'sharp'
import { fromRgba } from '@stabilityprotocol.com/phash'

/**
 * Generates a perceptual hash for a single image.
 *
 * The image is decoded with Sharp and converted into raw RGBA pixel data.
 * The pHash library then converts those pixels into a compact visual
 * fingerprint that can later be compared with another image hash.
 */
export async function generatePerceptualHash(imagePath: string): Promise<string> {
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // The pHash library expects RGBA pixels as a Uint8ClampedArray.
  const rgba = new Uint8ClampedArray(data)

  return fromRgba(rgba, info.width, info.height)
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
