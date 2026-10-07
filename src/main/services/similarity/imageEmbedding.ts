import { pipeline, RawImage, type ImageFeatureExtractionPipeline } from '@huggingface/transformers'

import { decodeImage } from '@main/services/imageDecoder'

// Photo inference runs locally; model loading may download uncached model assets.
const MODEL_ID = 'onnx-community/dinov2-small'

/**
 * Creates the DINOv2 image feature extraction pipeline.
 *
 * Full-precision weights are used initially so that baseline evaluation
 * is not affected by model quantization.
 */
function createFeatureExtractor(): Promise<ImageFeatureExtractionPipeline> {
  return pipeline('image-feature-extraction', MODEL_ID, {
    dtype: 'fp32'
  })
}

let featureExtractorPromise: ReturnType<typeof createFeatureExtractor> | null = null

/**
 * Loads and reuses the DINOv2 feature extraction pipeline.
 *
 * The pipeline is initialized only once during the current process.
 * Later calls reuse the same loading promise instead of creating another
 * model instance for every image.
 */
export function loadImageFeatureExtractor(): ReturnType<typeof createFeatureExtractor> {
  if (!featureExtractorPromise) {
    featureExtractorPromise = createFeatureExtractor()
  }

  return featureExtractorPromise
}

/**
 * Generates a DINOv2 embedding for a single supported image.
 *
 * The shared image decoder produces RGBA pixel data, which is converted
 * to RGB before being passed to DINOv2.
 *
 * DINOv2 returns hidden states for the CLS token and all image patches.
 * The first token is the CLS token, whose final hidden state is used as
 * the 384-dimensional representation of the complete image.
 */
export async function generateImageEmbedding(imagePath: string): Promise<number[]> {
  const featureExtractor = await loadImageFeatureExtractor()

  const decodedImage = await decodeImage(imagePath)

  const image = new RawImage(decodedImage.data, decodedImage.width, decodedImage.height, 4).rgb()

  const features = await featureExtractor(image)

  const hiddenSize = features.dims[features.dims.length - 1]

  if (!hiddenSize) {
    throw new Error('Unable to determine DINOv2 embedding size')
  }

  const embedding: number[] = []

  for (let i = 0; i < hiddenSize; i++) {
    embedding.push(Number(features.data[i]))
  }

  return embedding
}
