import { extname } from 'path'
import sharp, { type Sharp } from 'sharp'

import { decodeImage } from '@main/services/imageDecoder'
import { SUPPORTED_IMAGE_EXTENSIONS } from '@shared/constants/imageFormats'

const THUMBNAIL_SIZE = 360
const PREVIEW_SIZE = 1600

/**
 * Generates a resized WebP image from a supported local photo.
 *
 * HEIC files are decoded through the shared image decoder.
 * Other supported formats are processed directly by Sharp.
 *
 * The original aspect ratio is preserved without cropping,
 * stretching, or unnecessary enlargement.
 */
async function generateResizedPhoto(
  imagePath: string,
  size: number,
  quality: number
): Promise<Buffer> {
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
      width: size,
      height: size,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality })
    .toBuffer()
}

/**
 * Generates a WebP thumbnail within a 360px bounding box.
 */
export async function generatePhotoThumbnail(imagePath: string): Promise<Buffer> {
  return generateResizedPhoto(imagePath, THUMBNAIL_SIZE, 80)
}

/**
 * Generates a higher-resolution WebP image for photo previews
 * within a 1600px bounding box.
 */
export async function generatePhotoPreview(imagePath: string): Promise<Buffer> {
  return generateResizedPhoto(imagePath, PREVIEW_SIZE, 85)
}
