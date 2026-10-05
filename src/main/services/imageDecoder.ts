import { readFile } from 'fs/promises'
import { extname } from 'path'
import decodeHeic from 'heic-decode'
import sharp from 'sharp'

import { SUPPORTED_IMAGE_EXTENSIONS } from '@shared/constants/imageFormats'

export interface DecodedImage {
  data: Uint8ClampedArray
  width: number
  height: number
}

/**
 * Decodes a supported image into raw RGBA pixel data.
 *
 * HEIC images use heic-decode because the default Sharp/libvips build
 * may not include the HEVC decoder required by many HEIC files.
 *
 * JPEG, PNG, and WEBP images use Sharp directly.
 * Unsupported formats are rejected before decoding.
 */
export async function decodeImage(imagePath: string): Promise<DecodedImage> {
  const extension = extname(imagePath).toLowerCase()

  if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error(`Unsupported image format: ${extension || 'unknown'}`)
  }

  if (extension === '.heic') {
    const buffer = await readFile(imagePath)
    const decoded = await decodeHeic({ buffer })

    return {
      data: decoded.data,
      width: decoded.width,
      height: decoded.height
    }
  }

  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  return {
    data: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height
  }
}
