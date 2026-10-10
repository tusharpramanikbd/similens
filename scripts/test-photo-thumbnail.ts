import { basename } from 'path'
import sharp from 'sharp'

import { generatePhotoThumbnail } from '@main/services/photoThumbnail'

/**
 * Validates thumbnail generation for the provided image files.
 *
 * Each image is converted to a WebP thumbnail. The output format
 * and dimensions are checked to ensure the thumbnail meets
 * the expected size constraints.
 */
async function main(): Promise<void> {
  const imagePaths = process.argv.slice(2)

  if (imagePaths.length === 0) {
    throw new Error('At least one image path is required.')
  }

  for (const imagePath of imagePaths) {
    console.log(`\nTesting: ${basename(imagePath)}`)

    const thumbnail = await generatePhotoThumbnail(imagePath)

    const metadata = await sharp(thumbnail).metadata()

    if (metadata.format !== 'webp') {
      throw new Error('Thumbnail output must be WebP.')
    }

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to determine thumbnail dimensions.')
    }

    if (metadata.width > 360 || metadata.height > 360) {
      throw new Error('Thumbnail dimensions exceed 360 pixels.')
    }

    console.log(`Format: ${metadata.format}`)
    console.log(`Dimensions: ${metadata.width} × ${metadata.height}`)
    console.log(`Size: ${(thumbnail.length / 1024).toFixed(1)} KB`)
    console.log('Result: PASS')
  }
}

main().catch((error) => {
  console.error('Thumbnail validation failed:', error)

  process.exitCode = 1
})
