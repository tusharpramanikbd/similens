import { groupSimilarPhotos } from '@main/services/similarity/similarityGrouping'
import type { PhotoSimilarity } from '@shared/types/similarity'

const threshold = 0.9

const photoPathsA = ['A.jpg', 'B.jpg', 'C.jpg', 'D.jpg']

const photoPathsB = ['D.jpg', 'C.jpg', 'B.jpg', 'A.jpg']

const similarities: PhotoSimilarity[] = [
  {
    photoA: 'A.jpg',
    photoB: 'B.jpg',
    similarity: 0.96
  },
  {
    photoA: 'C.jpg',
    photoB: 'D.jpg',
    similarity: 0.95
  },
  {
    photoA: 'A.jpg',
    photoB: 'C.jpg',
    similarity: 0.4
  },
  {
    photoA: 'A.jpg',
    photoB: 'D.jpg',
    similarity: 0.3
  },
  {
    photoA: 'B.jpg',
    photoB: 'C.jpg',
    similarity: 0.35
  },
  {
    photoA: 'B.jpg',
    photoB: 'D.jpg',
    similarity: 0.25
  }
]

const groupsA = groupSimilarPhotos(photoPathsA, similarities, threshold)

const groupsB = groupSimilarPhotos(photoPathsB, similarities, threshold)

console.log('Result A:')
console.log(JSON.stringify(groupsA, null, 2))

console.log('\nResult B:')
console.log(JSON.stringify(groupsB, null, 2))

console.log('\nResults match:', JSON.stringify(groupsA) === JSON.stringify(groupsB))
