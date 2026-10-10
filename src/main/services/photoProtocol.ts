import { protocol } from 'electron'

import { getAccessiblePhotoPath } from '@main/services/photoAccessRegistry'
import { generatePhotoThumbnail } from '@main/services/photoThumbnail'

/**
 * Registers the handler for local photo thumbnail requests.
 *
 * Only registered photo identifiers are accepted. Supported photos
 * are converted into WebP thumbnails and returned as image responses.
 * Unknown identifiers and invalid requests are rejected.
 */
export function registerPhotoProtocolHandler(): void {
  protocol.handle('similens-photo', async (request): Promise<Response> => {
    if (request.method !== 'GET') {
      return new Response('Method not allowed', {
        status: 405
      })
    }

    const url = new URL(request.url)

    if (
      url.hostname !== 'thumbnail' ||
      url.port ||
      url.search ||
      url.hash ||
      !/^\/[0-9a-f-]{36}$/.test(url.pathname)
    ) {
      return new Response('Invalid photo URL', {
        status: 400
      })
    }

    const photoId = url.pathname.slice(1)

    const photoPath = getAccessiblePhotoPath(photoId)

    if (!photoPath) {
      return new Response('Photo not found', {
        status: 404
      })
    }

    try {
      const thumbnail = await generatePhotoThumbnail(photoPath)

      return new Response(new Uint8Array(thumbnail), {
        status: 200,
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff'
        }
      })
    } catch (error) {
      console.error('Failed to generate photo thumbnail:', error)

      return new Response('Unable to load photo thumbnail', {
        status: 500
      })
    }
  })
}
