import { extname } from 'path'
import sharp, { type Sharp } from 'sharp'

import { decodeImage } from '@main/services/imageDecoder'
import { SUPPORTED_IMAGE_EXTENSIONS } from '@shared/constants/imageFormats'

const THUMBNAIL_SIZE = 360

/**
 * Generates a WebP thumbnail from a supported local photo.
 *
 * HEIC files are decoded through the shared image decoder.
 * Other supported formats are processed directly by Sharp.
 *
 * The image is resized without stretching or unnecessary enlargement.
 */
export async function generatePhotoThumbnail(imagePath: string): Promise<Buffer> {
  const extension = extname(imagePath).toLowerCase()

  if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error(`Unsupported image format: ${extension || 'unknown'}`)
  }

  let image: Sharp

  if (extension === '.heic') {
    const decodedImage = await decodeImage(imagePath)

    image = sharp(Buffer.from(decodedImage.data), {
      raw: {
        width: decodedImage.width,
        height: decodedImage.height,
        channels: 4
      }
    })
  } else {
    image = sharp(imagePath).rotate()
  }

  return image
    .resize({
      width: THUMBNAIL_SIZE,
      height: THUMBNAIL_SIZE,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: 80 })
    .toBuffer()
}
