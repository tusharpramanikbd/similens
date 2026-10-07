# Similens — Milestone 2: AI Similarity Engine

**Document type:** Source of Truth  
**Project:** Similens  
**Milestone:** 2 — AI Similarity Engine  
**Status:** Complete
**Current state:** Implementation, evaluation, cleanup, and final regression validation are complete.  
**Purpose:** Define the exact scope, experiments, implementation tasks, acceptance criteria, evaluation evidence, and testing requirements for the first AI-powered similarity engine in Similens.

---

# 1. Milestone Goal

Milestone 2 introduces the first AI/computer-vision capability into Similens.

By the end of this milestone, Similens should be able to:

1. Take supported local photo paths discovered in Milestone 1.
2. Decode supported image formats locally.
3. Generate a visual representation for each photo.
4. Compare photos based on visual similarity.
5. Identify likely near-duplicate photos from the same shot, burst, scene, or moment.
6. Group similar photos into candidate similarity groups.
7. Avoid grouping clearly unrelated or meaningfully different photos.
8. Keep image inference local on the user's computer.
9. Produce structured similarity-group data that the review UI can consume in Milestone 3.

This milestone is about building and validating the **similarity engine**.

It is not about designing the final review interface or deleting photos.

---

# 2. Milestone Scope

## Included

- Small labeled evaluation dataset
- Ground-truth similarity groups
- Hard-negative evaluation examples
- Lightweight non-AI baseline
- Local pretrained vision model integration
- Shared image decoding
- Image preprocessing
- Image embedding generation
- Similarity calculation
- Threshold experiments
- False-positive analysis
- False-negative analysis
- Ground-truth correction when necessary
- Baseline vs AI comparison
- Similarity-group generation
- Deterministic grouping strategy
- Transitive grouping behavior
- Programmatic group-level validation
- Basic performance measurement
- Local-only image inference
- Structured similarity result types
- Manual and programmatic validation

## Explicitly Out of Scope

The following must **not** be implemented during Milestone 2:

- final similar-photo review UI
- photo selection checkboxes
- full-screen photo preview
- Move to Trash / Recycle Bin
- automatic deletion
- "best photo" recommendation
- image-quality scoring
- sharpness scoring
- blur scoring
- exposure scoring
- eye-state detection
- face-quality scoring
- face recognition
- person identification
- cloud AI APIs
- cloud image uploads
- semantic text-to-image search
- production-scale vector database
- persistent production embedding cache
- automatic model fine-tuning
- custom model training
- background folder watching
- large-scale production benchmarking
- final cross-platform packaging optimization

Those belong to later milestones.

---

# 3. Locked Technical Direction

The current validated technical direction is:

- AI image inference remains local.
- No paid/cloud AI inference API is used.
- DINOv2-small is the selected primary visual-feature model.
- The exact model artifact is `onnx-community/dinov2-small`.
- The base model is `facebook/dinov2-small`.
- Transformers.js is used for the current inference path.
- Current inference precision is FP32.
- DINOv2 embeddings contain 384 values.
- pHash is retained as the lightweight non-AI baseline.
- Similarity is based on visual features rather than filenames.
- Cosine similarity is used to compare DINOv2 embeddings.
- Higher cosine similarity means greater visual similarity.
- The current provisional DINOv2 threshold is `0.90`.
- Thresholds are calibrated experimentally rather than guessed.
- The current grouping engine uses deterministic greedy complete-link-style grouping.
- Two groups are merged only when every cross-group photo pair satisfies the similarity threshold.
- Singleton photos are excluded from the final similarity-group result.
- Final delete/keep decisions remain outside the AI engine.

The current model choice is based on the evaluation dataset available during Milestone 2.

It must not be interpreted as proof that DINOv2 will achieve perfect accuracy on all production photo collections.

The current threshold remains provisional and must be revisited when the evaluation dataset becomes larger or more diverse.

If future evaluation reveals a meaningful weakness, the model, threshold, grouping strategy, or ground truth should be reassessed.

---

# 4. Architecture for Milestone 2

The current high-level flow is:

```text
Photo paths from Milestone 1
            ↓
      Image decoding
            ↓
     Model preprocessing
            ↓
    DINOv2 inference
            ↓
       Embeddings
            ↓
   Cosine similarity
            ↓
 Pairwise similarities
            ↓
Complete-link-style grouping
            ↓
Candidate similarity groups
            ↓
Structured SimilarityGroup[]
            ↓
Future Milestone 3 review UI
```

The AI engine remains separate from React UI concerns.

## Current Relevant Structure

```text
src/
├── main/
│   ├── services/
│   │   ├── photoScanner.ts
│   │   ├── imageDecoder.ts
│   │   └── similarity/
│   │       ├── perceptualHash.ts
│   │       ├── imageEmbedding.ts
│   │       ├── embeddingSimilarity.ts
│   │       └── similarityGrouping.ts
│
├── shared/
│   ├── constants/
│   │   └── imageFormats.ts
│   └── types/
│       ├── photo.ts
│       └── similarity.ts
│
└── renderer/

scripts/
├── evaluate-phash.ts
├── test-dinov2.ts
├── evaluate-dinov2.ts
├── test-similarity-grouping.ts
└── evaluate-grouping.ts
```

The internal structure can continue to evolve, but the current separation is:

```text
imageDecoder
→ format-specific decoding

imageEmbedding
→ image → DINOv2 embedding

embeddingSimilarity
→ embedding vectors → cosine similarity

similarityGrouping
→ pairwise similarity data → groups
```

This keeps image decoding, AI inference, mathematical similarity, and grouping behavior separated.

---

# 5. Feature Breakdown

Milestone 2 contains six features.

```text
Feature 1
Evaluation Dataset & Ground Truth

Feature 2
Baseline Similarity Method

Feature 3
Local Vision Model Integration

Feature 4
Embedding Similarity & Threshold Calibration

Feature 5
Similarity Grouping / Clustering

Feature 6
Model Evaluation, Performance & Milestone Validation
```

---

# Feature 1 — Evaluation Dataset & Ground Truth

## Goal

Create a controlled dataset that allows Similens to be evaluated against known expected behavior.

Without labeled ground truth, model and threshold decisions would rely only on subjective visual guesses.

---

## 1.1 Evaluation Dataset

The evaluation dataset lives outside the public repository.

Current structure:

```text
similarity-evaluation/
├── group-01/
├── group-02/
├── same-person-different-shots/
├── hard-negatives/
├── unrelated/
└── ground-truth.json
```

Current composition:

```text
group-01                     → 5 positive near-duplicate photos
group-02                     → 5 positive near-duplicate photos

same-person-different-shots  → 5 negative photos
hard-negatives               → 10 negative photos
unrelated                    → 13 negative photos
```

Total:

```text
38 photos
```

---

## 1.2 Positive Near-Duplicate Groups

Positive examples represent photos that Similens should genuinely place in the same review group.

Examples may include:

- same burst
- same pose with small movement
- same moment with small framing changes
- eyes open vs closed
- small camera movement
- slight exposure differences

Current positive groups:

```text
group-01 → 5 photos
group-02 → 5 photos
```

---

## 1.3 Hard Negatives

Hard negatives are visually related photos that should still remain separate.

Examples:

- same person, different shot
- same room, different pose
- similar background
- same subject with meaningful framing changes
- similar scene but different moment
- noticeably different composition

Current difficult-negative sets:

```text
same-person-different-shots
hard-negatives
```

`same-person-different-shots` contains selfies of the same person with differences in:

- camera angle
- facial presentation
- framing
- visible body position
- background details
- composition

These are intentionally negative because the expected production behavior is to keep them separate.

---

## 1.4 Unrelated Negatives

The `unrelated` set includes clearly different images such as:

- portraits
- landscapes
- screenshots
- food photos
- buildings
- documents
- other unrelated scenes

These help detect obvious false positives.

---

## 1.5 Ground Truth

The dataset source of truth is:

```json
{
  "positiveGroups": [
    "group-01",
    "group-02"
  ],
  "negativeSets": {
    "samePersonDifferentShots": "same-person-different-shots",
    "hardNegatives": "hard-negatives",
    "unrelated": "unrelated"
  }
}
```

Evaluation scripts should read this metadata instead of duplicating positive and negative folder names manually.

This allows the evaluation dataset to evolve without requiring hard-coded group names inside the grouping validation script.

---

## Ground-Truth Correction During Evaluation

The folder now named:

```text
same-person-different-shots
```

was originally:

```text
group-03
```

and was initially treated as a positive near-duplicate group.

During DINOv2 evaluation, this set produced substantially lower similarity scores than `group-01` and `group-02`.

Manual inspection showed that the photos were:

- selfies of the same person
- taken from different camera angles
- different in facial presentation
- meaningfully different in framing/composition
- different in visible background details

The intended Similens behavior is **not** to group all five photos together.

The original positive label was therefore incorrect.

The folder was renamed to:

```text
same-person-different-shots
```

and reclassified as a negative evaluation set.

All pHash and DINOv2 metrics used for model comparison were recalculated after this correction.

Metrics calculated using the old `group-03` positive label are obsolete.

---

## 1.6 Evaluation Data Privacy

Personal evaluation photos must remain local.

Do not commit personal photos to the public repository.

Only reusable items such as:

- metadata
- synthetic/public samples
- evaluation scripts
- documentation

should be committed where appropriate.

---

## Feature 1 Acceptance Criteria

- [x] A local evaluation dataset exists.
- [x] It contains multiple positive near-duplicate groups.
- [x] It contains hard-negative examples.
- [x] It contains clearly unrelated examples.
- [x] Ground truth is documented.
- [x] Personal evaluation images are not accidentally committed to Git.
- [x] The dataset is sufficient for the current MVP proof-of-concept comparison.
- [x] Ambiguous ground-truth labels have been manually reviewed and corrected.

---

# Feature 2 — Baseline Similarity Method

## Goal

Implement a lightweight non-neural baseline before selecting the primary AI method.

The baseline provides a measurable comparison point.

---

## 2.1 Baseline

The current baseline uses:

```text
@stabilityprotocol.com/phash
```

Image decoding occurs through the shared decoder before RGBA pixel data is passed to the pHash implementation.

pHash similarity is represented using Hamming distance.

```text
lower distance
→ more visually similar

higher distance
→ less visually similar
```

---

## 2.2 Current Baseline API

```text
generatePerceptualHash(imagePath)

comparePerceptualHashes(hashA, hashB)

compareImagesPerceptually(imagePathA, imagePathB)
```

---

## 2.3 Repeatable Evaluation

```bash
npm run evaluate:phash
```

---

## Baseline Evaluation Results

The following results use the corrected ground truth.

Pair counts:

```text
Positive near-duplicate pairs:            20
Same-person-different-shot negative pairs: 10
Hard-negative pairs:                       45
Unrelated pairs:                           78

Total negative pairs:                     133
```

Measured pHash Hamming distances:

| Category | Pairs | Min | Max | Average |
| --- | ---: | ---: | ---: | ---: |
| Positive | 20 | 4 | 20 | 11.5 |
| Same person different shots | 10 | 16 | 38 | 27.6 |
| Hard negatives | 45 | 16 | 44 | 29.7 |
| Unrelated | 78 | 22 | 40 | 31.2 |

### Distribution Finding

Positive distances:

```text
4 → 20
```

Negative distances begin as low as:

```text
16
```

Therefore, the ranges overlap approximately between:

```text
16 → 20
```

A single pHash threshold cannot perfectly separate all positive and negative pairs in the current dataset.

---

## pHash Threshold Evaluation

For pHash:

```text
distance <= threshold
→ classify as similar
```

| Threshold | TP | FN | FP | TN | Precision | Recall | F1 |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 8 | 5 | 15 | 0 | 133 | 100.0% | 25.0% | 0.4000 |
| 10 | 7 | 13 | 0 | 133 | 100.0% | 35.0% | 0.5185 |
| 12 | 14 | 6 | 0 | 133 | 100.0% | 70.0% | 0.8235 |
| 14 | 16 | 4 | 0 | 133 | 100.0% | 80.0% | 0.8889 |
| 16 | 18 | 2 | 2 | 131 | 90.0% | 90.0% | 0.9000 |
| 18 | 19 | 1 | 3 | 130 | 86.4% | 95.0% | 0.9048 |
| 20 | 20 | 0 | 5 | 128 | 80.0% | 100.0% | 0.8889 |
| 22 | 20 | 0 | 12 | 121 | 62.5% | 100.0% | 0.7692 |

---

## Provisional pHash Threshold

Pure F1 is highest around:

```text
18
```

However, Similens places higher importance on minimizing false-positive grouping.

The provisional product-oriented pHash threshold is therefore:

```text
distance <= 14
```

At threshold `14`:

```text
TP = 16
FN = 4
FP = 0
TN = 133

Precision = 100%
Recall = 80%
F1 = 0.8889
```

This gives zero false positives on the current dataset but misses four positive pairs.

pHash remains a useful baseline rather than the selected primary similarity method.

---

## Feature 2 Acceptance Criteria

- [x] A working local perceptual-hash baseline exists.
- [x] It can compare two photos.
- [x] It has been tested on positive groups.
- [x] It has been tested on difficult negatives.
- [x] It has been tested on unrelated negatives.
- [x] Corrected ground-truth results are recorded.
- [x] Candidate thresholds have been evaluated.
- [x] Baseline limitations are understood.
- [x] No claim is made that pHash is the final similarity method.

---

# Feature 3 — Local Vision Model Integration

## Goal

Run a pretrained vision model locally and generate an embedding for a photo.

The selected model is DINOv2-small.

---

## Implemented Model Configuration

Model artifact:

```text
onnx-community/dinov2-small
```

Base model:

```text
facebook/dinov2-small
```

Runtime:

```text
@huggingface/transformers
```

Model family:

```text
DINOv2
```

License:

```text
Apache-2.0
```

Inference precision:

```text
FP32
```

Approximate full FP32 model size:

```text
~88.5 MB
```

Embedding dimension:

```text
384
```

The FP32 model is intentionally used during initial evaluation so correctness measurements are not affected by quantization.

---

## 3.1 DINOv2 Output

The selected ONNX model does not expose a generic pooled output compatible with the initial `pool: true` attempt.

Similens instead uses the first token from the final hidden state:

```text
DINOv2 CLS token
```

as the image-level representation.

Result:

```text
number[384]
```

---

## 3.2 Model Loading

Model loading remains outside UI code.

The model-loading promise is reused inside the current process instead of creating a new model instance for every photo.

Conceptually:

```text
first embedding request
        ↓
initialize DINOv2 pipeline
        ↓
cache pipeline promise
        ↓
reuse loaded pipeline
        ↓
later embedding requests
```

Transformers.js may also maintain a filesystem model cache.

The in-process pipeline cache and filesystem model cache are separate mechanisms.

---

## 3.3 Shared Image Decoding

Image decoding is centralized in:

```text
src/main/services/imageDecoder.ts
```

Current supported formats:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.heic`

The supported extension list is centralized in:

```text
src/shared/constants/imageFormats.ts
```

JPEG, PNG, and WEBP currently use Sharp.

HEIC uses:

```text
heic-decode
```

because the Sharp/libvips build used during development does not contain the HEVC decoder required by the tested HEIC files.

Current decode flow:

```text
JPEG / PNG / WEBP
        ↓
      Sharp
        ↓
      RGBA


HEIC
        ↓
   heic-decode
        ↓
      RGBA
```

Decoded image data is converted to RGB before entering the DINOv2 pipeline.

Model-provided preprocessing handles model-specific resizing, normalization, and tensor preparation.

---

## 3.4 Embedding API

Current conceptual API:

```text
generateImageEmbedding(imagePath)
```

Output:

```text
number[384]
```

---

## 3.5 Deterministic Embedding Behavior

Repeated embedding generation for the same unchanged image produced identical values during current evaluation.

Example:

```text
Repeated embedding matches: true
```

---

## 3.6 Local-Only Image Inference

Personal photos are processed locally.

Model files may be downloaded from Hugging Face during setup or initial model use.

That is different from image inference.

Similens does **not** send the user's photo to a remote inference API.

---

## Feature 3 Acceptance Criteria

- [x] Exact pretrained model is documented.
- [x] Model license is reviewed.
- [x] Model loads locally.
- [x] Model is not reloaded unnecessarily for every photo.
- [x] JPEG produces an embedding.
- [x] PNG produces an embedding.
- [x] WEBP produces an embedding.
- [x] HEIC decoding is supported.
- [x] Embedding has the expected 384-dimensional shape.
- [x] Same image produces stable results.
- [x] Unsupported formats fail with a controlled error.
- [x] Personal image data is not sent to a remote inference API.
- [x] Build/type checks pass.

---

# Feature 4 — Embedding Similarity & Threshold Calibration

## Goal

Turn DINOv2 embeddings into a useful similarity signal and select a practical threshold using labeled data.

---

## 4.1 Cosine Similarity

Current API:

```text
calculateCosineSimilarity(embeddingA, embeddingB)
```

For DINOv2:

```text
higher cosine similarity
→ more visually similar

lower cosine similarity
→ less visually similar
```

The score is not a probability.

For example:

```text
0.94
```

does **not** mean:

```text
94% probability that the photos are duplicates
```

---

## 4.2 Basic Sanity Tests

Initial tests produced:

| Comparison | Cosine Similarity |
| --- | ---: |
| Same image vs itself | ~1.0000 |
| Known near-duplicate pair | 0.9550 |
| Hard-negative pair | 0.7025 |
| Unrelated pair | 0.0431 |

Expected ordering:

```text
same image
   ↓
near duplicate
   ↓
hard negative
   ↓
unrelated
```

The same-image result was:

```text
1.0000000000000002
```

because of normal floating-point precision.

Conceptually:

```text
≈ 1.0
```

---

## 4.3 Repeatable DINOv2 Evaluation

```bash
npm run evaluate:dinov2
```

One embedding is generated per image and stored in memory.

Pairwise comparisons reuse those embeddings.

```text
image paths
    ↓
one embedding per image
    ↓
Map<imagePath, embedding>
    ↓
pairwise cosine similarities
```

This avoids unnecessarily running DINOv2 repeatedly for the same image during one evaluation.

---

## 4.4 Score Distributions

Corrected ground-truth results:

| Category | Pairs | Min | Max | Average |
| --- | ---: | ---: | ---: | ---: |
| Positive | 20 | 0.9243 | 0.9783 | 0.9532 |
| Same person different shots | 10 | 0.5718 | 0.8639 | 0.7403 |
| Hard negatives | 45 | 0.4172 | 0.8331 | 0.6197 |
| Unrelated | 78 | -0.0779 | 0.3842 | 0.0418 |

Weakest genuine positive:

```text
0.9243
```

Strongest negative:

```text
0.8639
```

Current separation:

```text
highest negative = 0.8639

        gap

lowest positive  = 0.9243
```

Approximate gap:

```text
0.9243 - 0.8639 = 0.0604
```

The pHash result did not produce a comparable clean gap.

---

## 4.5 DINOv2 Threshold Evaluation

For DINOv2:

```text
similarity >= threshold
→ classify as similar
```

| Threshold | TP | FN | FP | TN | Precision | Recall | F1 |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0.60 | 20 | 0 | 32 | 101 | 38.5% | 100.0% | 0.5556 |
| 0.65 | 20 | 0 | 25 | 108 | 44.4% | 100.0% | 0.6154 |
| 0.70 | 20 | 0 | 17 | 116 | 54.1% | 100.0% | 0.7018 |
| 0.75 | 20 | 0 | 10 | 123 | 66.7% | 100.0% | 0.8000 |
| 0.80 | 20 | 0 | 5 | 128 | 80.0% | 100.0% | 0.8889 |
| 0.85 | 20 | 0 | 1 | 132 | 95.2% | 100.0% | 0.9756 |
| 0.90 | 20 | 0 | 0 | 133 | 100.0% | 100.0% | 1.0000 |

---

## 4.6 Manual False-Positive Inspection

At threshold `0.80`, five negative pairs were incorrectly classified as similar.

They came from:

- `same-person-different-shots`
- `hard-negatives`

Manual inspection confirmed that these pairs should remain separate.

Observed causes included:

- same person
- similar background
- same curtain or wall
- related composition
- different framing
- different visible body/hand position
- different camera position

This reinforced the need for a stricter threshold.

---

## 4.7 False Negatives and Ground-Truth Correction

During earlier evaluation, several pairs from the old `group-03` appeared as false negatives.

Manual review showed that the main problem was the original ground-truth label.

Those photos were reclassified as:

```text
same-person-different-shots
```

After correction, the current positive sets contain no false negatives at the selected threshold.

---

## 4.8 Selected DINOv2 Threshold

Current provisional threshold:

```text
0.90
```

At `0.90`:

```text
TP = 20
FN = 0
FP = 0
TN = 133

Precision = 100.0%
Recall = 100.0%
F1 = 1.0000
```

This result applies only to the **current 38-photo evaluation dataset**.

It must not be described as:

```text
DINOv2 is 100% accurate
```

or:

```text
Similens will have 100% production accuracy
```

Future datasets should include greater variation in:

- people
- devices
- lighting
- camera angle
- crop
- movement
- resolution
- burst behavior
- scene movement
- difficult near-duplicates

The threshold should be recalibrated if future evaluation reveals overlap around `0.90`.

---

## 4.9 pHash vs DINOv2

### pHash

```text
threshold: distance <= 14

TP = 16
FN = 4
FP = 0
TN = 133

Precision = 100%
Recall = 80%
F1 = 0.8889
```

### DINOv2

```text
threshold: cosine similarity >= 0.90

TP = 20
FN = 0
FP = 0
TN = 133

Precision = 100%
Recall = 100%
F1 = 1.0000
```

### Comparison

| Metric | pHash | DINOv2 |
| --- | ---: | ---: |
| Provisional threshold | ≤ 14 | ≥ 0.90 |
| True positives | 16 | 20 |
| False negatives | 4 | 0 |
| False positives | 0 | 0 |
| True negatives | 133 | 133 |
| Precision | 100% | 100% |
| Recall | 80% | 100% |
| F1 | 0.8889 | 1.0000 |

---

## Model Selection Decision

On the current corrected dataset, DINOv2 provides better separation between genuine near-duplicates and difficult negatives.

pHash:

```text
Positive range:
4 → 20

Negative range:
starts at 16
```

DINOv2:

```text
highest negative = 0.8639

        gap

lowest positive  = 0.9243
```

Therefore the selected primary pairwise method is:

```text
DINOv2-small embeddings
+
cosine similarity
+
provisional threshold 0.90
```

pHash remains:

- a lightweight baseline
- a sanity-check comparison
- evidence supporting the embedding-based selection

CLIP does not need to be evaluated during this milestone because the current comparison provides a sufficiently clear direction.

Additional models should only be introduced if future evidence justifies them.

---

## Feature 4 Acceptance Criteria

- [x] Embedding similarity function exists.
- [x] Same-image similarity behaves as expected.
- [x] Positive and negative pairs have been measured.
- [x] Threshold experiments are recorded.
- [x] False positives are inspected manually.
- [x] False negatives and apparent false negatives are inspected manually.
- [x] Incorrect ground truth discovered during evaluation has been corrected.
- [x] An initial threshold is selected based on evidence.
- [x] AI approach is compared against the baseline.
- [x] Current model choice is documented with limitations.

---

# Feature 5 — Similarity Grouping / Clustering

## Goal

Convert pairwise similarity scores into usable candidate near-duplicate groups.

The output should represent photos likely belonging to the same shot, burst, scene, or moment without aggressively chaining together meaningfully different photos.

---

## 5.1 Shared Similarity Types

Current shared types include:

```ts
interface PhotoSimilarity {
  photoA: string
  photoB: string
  similarity: number
}

interface SimilarityGroup {
  id: string
  photos: string[]
}
```

These types live in:

```text
src/shared/types/similarity.ts
```

`PhotoSimilarity` represents a precomputed pairwise similarity.

`SimilarityGroup` represents a structured group that can later be consumed by the renderer.

---

## 5.2 Selected Grouping Strategy

The current grouping engine uses a:

```text
deterministic
greedy
complete-link-style
threshold grouping strategy
```

The main grouping API is:

```text
groupSimilarPhotos(
  photoPaths,
  similarities,
  threshold
)
```

---

## Why Connected Components Were Not Selected

Consider:

```text
A ↔ B = 0.96
B ↔ C = 0.94
A ↔ C = 0.88

threshold = 0.90
```

A simple threshold graph plus connected components would produce:

```text
A — B — C
```

and may group:

```text
[A, B, C]
```

even though:

```text
A ↔ C
```

does not meet the threshold.

This chaining behavior is too permissive for Similens.

A false-positive group is more harmful than missing a borderline duplicate because the user may be reviewing photos for deletion.

---

## 5.3 Complete-Link-Style Merge Rule

Every photo initially starts in its own temporary group.

Similarity pairs are processed from strongest to weakest.

Two current groups can merge only when:

```text
every photo in group A
meets the threshold against
every photo in group B
```

Conceptually:

```text
Group A = [A, B]
Group B = [C]

Check:

A ↔ C >= threshold
AND
B ↔ C >= threshold
```

Only then can `C` join the group.

This applies equally to:

```text
one photo ↔ one photo

one photo ↔ group

group ↔ group
```

because a single photo can be treated as a one-item group.

---

## 5.4 Similarity Lookup

Precomputed similarities are converted into a bidirectional lookup structure.

Conceptually:

```text
A
├── B → 0.96
└── C → 0.88

B
├── A → 0.96
└── C → 0.94
```

Both:

```text
A → B
```

and:

```text
B → A
```

return the same similarity score.

Full photo paths are used as keys, so identical filenames in different folders do not collide.

A missing pairwise score is treated as a failed merge condition.

---

## 5.5 Strongest-Pair-First Processing

Similarity pairs are sorted from highest score to lowest score.

Example:

```text
0.97
0.96
0.94
0.91
0.72
...
```

This allows the strongest relationships to form groups first.

When two pairs contain exactly the same similarity score, canonical photo-path ordering is used as a deterministic tie-breaker.

This prevents grouping results from depending on the original array order.

---

## 5.6 Singleton Exclusion

Temporary one-photo groups may exist during processing.

Final output removes groups where:

```text
group.length === 1
```

A photo with no sufficiently similar partner therefore remains outside the similarity-group result.

---

## 5.7 Duplicate Membership

Each photo exists in one current temporary group.

When two groups merge:

```text
group A + group B
→ one merged group
```

the second group is removed.

This prevents a photo from accidentally appearing in multiple equivalent final groups.

---

## 5.8 Deterministic Output

Final group members are normalized by photo-path ordering.

Groups themselves are also normalized before IDs are assigned.

This ensures that changing:

- input photo order
- pair direction
- similarity-array order

does not change the logical output.

Example:

```text
Input:

[A, B, C]
```

and:

```text
[C, B, A]
```

produce the same normalized output.

---

## 5.9 Synthetic Grouping Validation

The grouping algorithm was tested against controlled synthetic cases.

### Test 1 — Transitive Chaining

```text
A-B = 0.96
B-C = 0.94
C-D = 0.93

A-C = 0.88
B-D = 0.50
A-D = 0.40

threshold = 0.90
```

Expected:

```text
[A, B]
[C, D]
```

Result:

```text
PASS
```

The algorithm does not create an invalid transitive chain.

---

### Test 2 — All Pairs Pass

```text
A-B = 0.96
A-C = 0.94
B-C = 0.95
```

Expected:

```text
[A, B, C]
```

Result:

```text
PASS
```

---

### Test 3 — Singleton Exclusion

```text
A, B, C
→ mutually similar

D
→ below threshold against all
```

Expected:

```text
[A, B, C]
```

with `D` excluded.

Result:

```text
PASS
```

---

### Test 4 — Missing Pairwise Similarity

```text
A-B = 0.96
B-C = 0.95
A-C = missing
```

Expected:

```text
[A, B]
```

`C` cannot join because complete-link verification cannot confirm `A-C`.

Result:

```text
PASS
```

---

### Test 5 — Equal-Score Input Ordering

Equivalent similarity arrays with different ordering produced identical final output.

Result:

```text
PASS
```

---

### Test 6 — Reversed Pair Direction

```text
A-B
```

versus:

```text
B-A
```

produced identical output.

Result:

```text
PASS
```

---

### Test 7 — Reversed Photo Input Order

```text
[A, B, C]
```

versus:

```text
[C, B, A]
```

produced identical normalized output.

Result:

```text
PASS
```

---

### Test 8 — Multiple Independent Groups

Input contained:

```text
A-B
C-D
```

with low cross-group similarities.

Both forward and reversed photo input order produced:

```json
[
  {
    "id": "group-1",
    "photos": [
      "A.jpg",
      "B.jpg"
    ]
  },
  {
    "id": "group-2",
    "photos": [
      "C.jpg",
      "D.jpg"
    ]
  }
]
```

Result:

```text
PASS
```

---

## 5.10 Real Dataset Grouping Evaluation

The full 38-photo evaluation dataset was processed as one collection.

This is important because it tests not only within-category pairs but also all cross-folder relationships.

Dataset:

```text
38 photos
```

Unique pairwise comparisons:

```text
38 × 37 / 2
=
703 pairs
```

Threshold:

```text
0.90
```

Produced groups:

```text
group-1
  group-01/1.jpeg
  group-01/2.jpeg
  group-01/3.jpeg
  group-01/4.jpeg
  group-01/5.jpeg

group-2
  group-02/1.jpeg
  group-02/2.jpeg
  group-02/3.jpeg
  group-02/4.jpeg
  group-02/5.jpeg
```

Total:

```text
2 groups
```

No similarity group was produced from:

```text
same-person-different-shots
hard-negatives
unrelated
```

---

## 5.11 Programmatic Ground-Truth Validation

The grouping evaluation reads:

```text
ground-truth.json
```

as the source of truth.

Positive and negative folders are loaded dynamically.

The evaluation script therefore does not manually duplicate:

```text
group-01
group-02
...
```

inside the validation logic.

Conceptually:

```text
ground-truth.json
        ↓
positive group folders
negative set folders
        ↓
load photos
        ↓
run similarity engine
        ↓
actual SimilarityGroup[]
        ↓
compare with expected groups
```

The comparison:

- ignores generated group IDs
- normalizes photo order
- normalizes group order
- compares actual photo membership against expected group membership

Current result:

```text
Ground-truth grouping match: true
```

If a future model, threshold, or grouping change causes a mismatch, the evaluation command exits with a failure status.

---

## Feature 5 Acceptance Criteria

- [x] Pairwise similarity can be converted into groups.
- [x] Groups contain at least two photos.
- [x] Known positive groups are represented correctly on the current dataset.
- [x] Clearly unrelated photos are not grouped.
- [x] Difficult negative sets are not incorrectly grouped.
- [x] Transitive edge cases are tested.
- [x] Duplicate/overlapping membership behavior is defined.
- [x] Group output is deterministic.
- [x] Missing pairwise similarities are handled conservatively.
- [x] Group data is structured for later renderer consumption.
- [x] Full-dataset grouping is programmatically compared against ground truth.

---

# Feature 6 — Model Evaluation, Performance & Milestone Validation

## Goal

Validate that the current similarity engine is technically sound enough to become the foundation for the review UI.

---

## 6.1 Repeatable Evaluation Workflow

Current evaluation commands include:

```bash
npm run evaluate:phash
npm run test:dinov2
npm run evaluate:dinov2
npm run test:grouping
npm run evaluate:grouping
```

Production validation also includes:

```bash
npm run lint
npm run build
```

The workflow is designed to remain rerunnable after future:

- model changes
- threshold changes
- grouping changes
- ground-truth changes

---

## 6.2 Pairwise Quality Evaluation

The labeled dataset records:

- true positives
- false positives
- false negatives
- true negatives
- precision
- recall
- F1 score
- score distributions
- threshold behavior

Current DINOv2 pairwise configuration:

```text
Model:
onnx-community/dinov2-small

Embedding:
384-dimensional CLS representation

Similarity:
cosine similarity

Threshold:
>= 0.90
```

Current corrected pairwise result:

```text
TP = 20
FN = 0
FP = 0
TN = 133

Precision = 100%
Recall = 100%
F1 = 1.0000
```

This result applies only to the current dataset.

---

## 6.3 Group-Level Quality Evaluation

Feature 5 adds group-level validation.

Current real-dataset result:

```text
Photos: 38
Pairs: 703
Expected positive groups: 2
Produced groups: 2
Ground-truth grouping match: true
```

The two expected positive groups were reproduced exactly.

No false similarity group was created from the negative evaluation sets.

---

## 6.4 Manual Error Inspection

False positives observed at lower thresholds were manually inspected.

The investigation identified patterns including:

- same person
- similar background
- related composition
- same wall or curtain
- similar scene structure

These examples justified using a stricter threshold.

Apparent false negatives from the original `group-03` were also manually inspected.

That review revealed a ground-truth labeling problem rather than simply a model failure.

The ground truth was corrected before final metrics were used.

---

## 6.5 Basic Performance Measurement

Performance is measured using the current labeled evaluation dataset rather than assigning an arbitrary "small" or "medium" label.

Current dataset:

```text
38 photos
703 unique pairwise comparisons
2 expected positive similarity groups
```

The purpose of the current benchmark is to verify that local similarity processing is practical for the Milestone 2 proof of concept.

Large-scale production benchmarking is deferred until the review UI is integrated.

At that stage, testing can be expanded to:

```text
hundreds of photos
thousands of photos
larger real-world folders
```

This will allow both numerical and visual evaluation of grouping behavior.

---

## 6.6 Performance Measurement Method

Performance was measured across:

```text
5 fresh Node.js process runs
```

The DINOv2 model files were already available in the local filesystem cache.

Therefore:

```text
model download time
```

is **not** included in these measurements.

Measured stages:

- model load / initialization
- embedding generation
- average embedding time per image
- pairwise cosine calculation
- grouping
- total similarity pipeline

---

## 6.7 Five-Run Benchmark Results

### Individual Runs

#### Run 1

```text
Model load time:                    106.3 ms
Embedding generation time:        2761.5 ms
Average embedding time per image:   72.7 ms
Pairwise similarity time:            1.1 ms
Grouping time:                       9.9 ms
Total similarity pipeline time:   2879.0 ms
Ground-truth grouping match: true
```

#### Run 2

```text
Model load time:                    105.1 ms
Embedding generation time:        2824.2 ms
Average embedding time per image:   74.3 ms
Pairwise similarity time:            1.1 ms
Grouping time:                       8.2 ms
Total similarity pipeline time:   2938.8 ms
Ground-truth grouping match: true
```

#### Run 3

```text
Model load time:                    106.3 ms
Embedding generation time:        2802.1 ms
Average embedding time per image:   73.7 ms
Pairwise similarity time:            1.1 ms
Grouping time:                       8.2 ms
Total similarity pipeline time:   2918.1 ms
Ground-truth grouping match: true
```

#### Run 4

```text
Model load time:                    112.4 ms
Embedding generation time:        2797.1 ms
Average embedding time per image:   73.6 ms
Pairwise similarity time:            1.1 ms
Grouping time:                       8.4 ms
Total similarity pipeline time:   2919.3 ms
Ground-truth grouping match: true
```

#### Run 5

```text
Model load time:                    108.1 ms
Embedding generation time:        2796.3 ms
Average embedding time per image:   73.6 ms
Pairwise similarity time:            1.1 ms
Grouping time:                       9.9 ms
Total similarity pipeline time:   2915.6 ms
Ground-truth grouping match: true
```

---

## 6.8 Performance Summary

| Metric | Average | Median |
| --- | ---: | ---: |
| Model load time | 107.6 ms | 106.3 ms |
| Embedding generation | 2796.2 ms | 2797.1 ms |
| Average embedding time per image | 73.6 ms | 73.6 ms |
| Pairwise similarity calculation | 1.1 ms | 1.1 ms |
| Grouping | 8.9 ms | 8.4 ms |
| Total similarity pipeline | 2914.2 ms | 2918.1 ms |

Representative median pipeline result:

```text
38 photos
703 pairs

Model load:
~106 ms

Embedding generation:
~2.80 s

Average embedding:
~73.6 ms/image

Pairwise similarity:
~1.1 ms

Grouping:
~8.4 ms

Total similarity pipeline:
~2.92 s
```

---

## 6.9 Performance Finding

The dominant runtime cost is:

```text
DINOv2 embedding generation
```

It accounts for approximately:

```text
~96% of the measured pipeline time
```

Pairwise cosine comparison and grouping are comparatively inexpensive on the current dataset.

Therefore, if future optimization becomes necessary, the primary optimization target should be embedding generation rather than prematurely optimizing cosine similarity or grouping logic.

Possible future areas include:

- batching
- inference/runtime optimization
- persistent embedding caching
- hardware acceleration
- model precision changes
- parallel processing where appropriate

These are not required for the current MVP milestone.

---

## 6.10 Avoid Repeated Inference

Within one evaluation run:

```text
one image
→ one embedding
```

The embedding is stored in memory.

All pairwise comparisons reuse that embedding.

For 38 photos:

```text
38 DINOv2 embedding generations
```

are performed, not:

```text
703 × 2 model inferences
```

Persistent embedding caching across application sessions is deferred to a later optimization stage.

---

## 6.11 Local-Only Processing

Personal image inference remains local.

The model may be downloaded from Hugging Face.

However:

```text
model download
≠
photo inference
```

User photos are not sent to a remote inference endpoint.

---

## 6.12 Future Visual Validation

Milestone 2 validates the grouping engine primarily through:

- labeled ground truth
- numerical similarity results
- threshold experiments
- synthetic grouping tests
- programmatic group comparison
- manual inspection of selected difficult pairs

After the review UI is available, larger real-world photo collections should also be evaluated visually.

This matters because a mathematically valid similarity relationship does not always guarantee that a group feels correct to a human reviewer.

For example, an algorithm may produce:

```text
Photo A
Photo B
Photo C
Photo D
```

inside one group because all required similarity conditions pass.

However, a human reviewer may still feel that:

```text
Photo D
```

does not visually belong with the others.

Future evaluation should therefore consider both:

```text
measured similarity/grouping behavior
+
human visual judgment
```

If visually questionable groups appear, the following may need adjustment:

- similarity threshold
- grouping strategy
- model choice
- ground-truth dataset
- product definition of "near duplicate"

This larger visual validation should happen after Milestone 3 provides an effective review interface.

---

## Feature 6 Acceptance Criteria

- [x] Evaluation workflow exists for the grouping engine.
- [x] Pairwise similarity quality is measured on labeled data.
- [x] Important pairwise false positives are reviewed.
- [x] Important apparent false negatives are reviewed.
- [x] Group-level quality is evaluated against ground truth.
- [x] Basic performance is recorded.
- [x] Multiple fresh-process benchmark runs are recorded.
- [x] The final current model/threshold/grouping configuration is documented.
- [x] Local-only image inference is verified.
- [x] Current build/type validation has passed during Milestone 2 development.
- [x] Engine output is structurally suitable for later renderer consumption.
- [x] Final post-cleanup regression validation is complete.

---

# 6. Milestone 2 End-to-End Acceptance Test

The final engine configuration should satisfy the following workflow.

1. Start from a clean development run.
2. Load or initialize the DINOv2 model.
3. Confirm the model initializes successfully.
4. Process a known image.
5. Confirm a 384-dimensional embedding is produced.
6. Process the same unchanged image again.
7. Confirm output is stable.
8. Compare an image with itself.
9. Compare a known near-duplicate pair.
10. Compare a difficult negative pair.
11. Compare an unrelated pair.
12. Confirm score ordering is sensible.
13. Run the full 38-photo labeled dataset.
14. Generate all 703 unique pairwise similarities.
15. Generate candidate similarity groups.
16. Compare produced groups against `ground-truth.json`.
17. Confirm both known positive groups are recovered.
18. Confirm negative sets do not create false groups.
19. Confirm singleton unrelated images are excluded.
20. Confirm transitive chaining is handled conservatively.
21. Confirm reversed input order produces deterministic output.
22. Compare DINOv2 results against the pHash baseline.
23. Confirm no personal image is uploaded to a cloud inference service.
24. Record model, threshold, grouping strategy, and performance results.
25. Run:

```bash
npm run lint
npm run build
```

26. Run the relevant evaluation commands:

```bash
npm run evaluate:phash
npm run test:dinov2
npm run evaluate:dinov2
npm run test:grouping
npm run evaluate:grouping
```

Most of these behaviors have already been validated individually during Features 1–6.

A final regression pass should be run after the milestone-end code cleanup.

---

# 7. Milestone 2 Definition of Done

Milestone 2 is complete only when **all** required items are satisfied.

---

## Evaluation Foundation

- [x] Labeled local evaluation dataset exists.
- [x] Positive near-duplicate groups exist.
- [x] Hard negatives exist.
- [x] Same-person-but-different-shot negatives exist.
- [x] Unrelated negatives exist.
- [x] Ground truth is documented.
- [x] Evaluation scripts use the ground-truth metadata as the source of truth where appropriate.
- [x] Ambiguous ground truth has been manually reviewed.
- [x] Private test photos are excluded from Git.

---

## Baseline

- [x] Perceptual-hash baseline exists.
- [x] Baseline results are recorded using corrected ground truth.
- [x] Baseline thresholds are evaluated.
- [x] Baseline limitations are understood.

---

## AI Model

- [x] Exact model is documented.
- [x] Model licensing is reviewed.
- [x] Model runs locally.
- [x] Image embeddings are generated.
- [x] Model output shape is verified.
- [x] Supported decoding behavior is documented.
- [x] No remote image inference occurs.

---

## Similarity

- [x] Cosine similarity calculation works.
- [x] Positive and negative score behavior is measured.
- [x] Threshold experiments are complete for the current dataset.
- [x] Initial threshold is evidence-based.
- [x] False positives are reviewed.
- [x] Apparent false negatives are reviewed.
- [x] Incorrect ground truth discovered during evaluation has been corrected.
- [x] Baseline vs AI comparison is documented.
- [x] DINOv2 is selected as the current primary similarity method.

---

## Grouping

- [x] Similar photos can be grouped.
- [x] Groups contain at least two photos.
- [x] Unrelated singleton images are excluded.
- [x] Difficult negatives are excluded from false groups on the current dataset.
- [x] Transitive similarity behavior is explicitly tested.
- [x] Missing pairwise data is handled conservatively.
- [x] Duplicate membership behavior is defined.
- [x] Group output is deterministic.
- [x] Structured group results exist for future UI use.
- [x] Real-dataset grouping matches current ground truth.

---

## Quality

- [x] Baseline vs AI comparison is documented.
- [x] Pairwise quality is measured.
- [x] Group-level quality is measured.
- [x] Basic performance is measured.
- [x] Five-run performance benchmark is recorded.
- [x] Current build/type checks have passed during development.
- [x] No known crash exists in the current evaluation workflow.
- [x] Current model/threshold limitations are documented.
- [x] Current grouping-engine validation is complete.
- [x] Final post-cleanup regression validation is complete.

---

## Scope Discipline

- [x] No photo deletion has been implemented.
- [x] No best-photo scoring has been implemented.
- [x] No final review gallery has been implemented.
- [x] No cloud AI API has been introduced.
- [x] No unnecessary custom model training has been introduced.
- [x] No premature production-scale optimization has been introduced.

---

## Milestone-End Code Cleanup

Before Milestone 3 begins:

- [x] Refactor the current `groupSimilarPhotos()` implementation into smaller single-purpose helper functions without changing its validated behavior.
- [x] Review relevant code comments and replace command-like wording with neutral, implementation-focused wording.
- [x] Keep comments focused on what the code/function does rather than addressing the developer directly.
- [x] Run final lint, build, synthetic grouping tests, and real-dataset evaluations after the refactor.
- [x] Confirm ground-truth grouping still matches after cleanup.

The cleanup is intentionally performed after algorithm validation so structural refactoring does not interfere with experimentation.

---

# 8. Current Final Milestone Configuration

The currently validated similarity-engine configuration is:

```text
Image decoding
    ↓
shared image decoder

Model
    ↓
onnx-community/dinov2-small

Representation
    ↓
384-dimensional CLS embedding

Similarity
    ↓
cosine similarity

Threshold
    ↓
>= 0.90

Grouping
    ↓
deterministic greedy complete-link-style grouping

Singleton behavior
    ↓
excluded

Ground-truth validation
    ↓
ground-truth.json

Output
    ↓
SimilarityGroup[]
```

---

# 9. Suggested Implementation / Completion Order

The Milestone 2 development sequence is:

```text
Feature 1
Evaluation Dataset & Ground Truth
        ↓
Validate dataset
        ↓
Commit


Feature 2
Baseline Similarity Method
        ↓
Record results
        ↓
Commit


Feature 3
Local Vision Model Integration
        ↓
Verify embeddings
        ↓
Commit


Feature 4
Similarity & Threshold Calibration
        ↓
Compare against baseline
        ↓
Commit


Feature 5
Similarity Grouping
        ↓
Synthetic validation
        ↓
Real-dataset validation
        ↓
Ground-truth comparison
        ↓
Commit


Feature 6
Performance & Full Evaluation
        ↓
Benchmark
        ↓
Document current configuration
        ↓
Commit


Milestone-End Cleanup
        ↓
Refactor grouping implementation
        ↓
Clean comment wording
        ↓
Final regression validation
        ↓
Final documentation sync
        ↓
Commit


Milestone 2 complete
        ↓
Define Milestone 3
```

Small, meaningful commits are preferred over one large milestone commit.

---

# 10. Git Commit Checkpoints

Milestone 2 has used small, reviewable commits.

Relevant examples include:

```text
chore: add similarity evaluation dataset metadata

feat: add perceptual similarity baseline

feat: add DINOv2, shared decoding, HEIC and WEBP support

feat: add DINOv2 similarity evaluation and threshold calibration

feat: compare DINOv2 and perceptual similarity baselines

feat: add deterministic complete-link similarity grouping

test: validate similarity grouping on evaluation dataset

refactor: load grouping ground truth from dataset metadata
```

Remaining milestone-end work should also use focused commits.

Possible final checkpoints:

```text
refactor: simplify similarity grouping implementation

chore: clean similarity engine comments

chore: complete milestone 2 validation
```

Exact wording may change based on the final diff.

---

# 11. Important Experimental Rules

## Do Not Declare a Model Universally "Best"

A newer or larger model is not automatically better.

The relevant question is:

```text
Which method best separates our real near-duplicate photos
from visually related but genuinely different photos?
```

The current evidence supports DINOv2 over pHash for this dataset.

This is an evidence-based project decision, not a universal model-ranking claim.

---

## Do Not Treat Similarity as Probability

A score such as:

```text
0.94
```

must not automatically be presented as:

```text
94% probability that these photos are duplicates
```

unless the score has specifically been calibrated as a probability.

---

## Ground Truth Must Represent Product Intent

Being:

- the same person
- in the same room
- against the same background
- visually related
- semantically related

does not automatically make two photos near-duplicates.

Ground truth should represent the behavior expected from the production app.

If evaluation results expose a questionable label, the images should be manually inspected before the case is treated as model failure.

---

## False Positives Matter

For Similens, false-positive grouping is especially important.

If genuinely different photos are placed into one duplicate-review group, the user may incorrectly treat them as redundant.

The current threshold and complete-link grouping strategy are intentionally conservative for this reason.

---

## Protect Personal Data

Evaluation photos may contain personal content.

Rules:

- keep personal test images local
- do not commit them
- do not send them to remote inference APIs
- use Git ignore rules where appropriate
- distinguish model-file downloading from photo inference

---

## Prefer Evidence Over Complexity

Start simple.

Only add:

- more models
- more clustering algorithms
- persistent caching
- vector indexes
- advanced optimization
- large-scale infrastructure

when an observed limitation justifies them.

---

## Numerical Validation Is Not the End of Visual Validation

Programmatic ground-truth matching is necessary but not sufficient for the final product.

After the review UI is available, groups should also be judged visually.

A group may satisfy the current mathematical rule while still feeling questionable to a human reviewer.

Future product validation should combine:

```text
quantitative evaluation
+
human visual inspection
```

---

# 12. Current Milestone Output

The internal engine can now conceptually perform:

```text
Input:

[
  "/photos/a.jpg",
  "/photos/b.jpg",
  "/photos/c.jpg",
  "/photos/d.jpg"
]

          ↓

Local DINOv2 feature extraction

          ↓

Embeddings

          ↓

Pairwise cosine similarity

          ↓

Threshold + complete-link grouping

          ↓

Output:

[
  {
    "id": "group-1",
    "photos": [
      "/photos/a.jpg",
      "/photos/b.jpg",
      "/photos/c.jpg"
    ]
  }
]
```

If:

```text
/photos/d.jpg
```

has no sufficiently similar match, it remains outside the result.

Milestone 3 will be responsible for presenting similarity groups visually to the user.

---

# 13. Known Current Limitations

The current results are encouraging but intentionally limited.

Current limitations include:

- only 38 labeled evaluation photos
- only two confirmed positive groups
- limited camera/device diversity
- limited subject diversity
- limited lighting variation
- limited crop/resolution variation
- no large-folder benchmark yet
- no review UI yet
- no large-scale human visual group inspection yet
- threshold `0.90` remains provisional
- grouping behavior may need adjustment after broader visual review
- no persistent embedding cache
- no inference batching optimization
- no formal memory benchmark
- no quantized-model comparison

These limitations are acceptable for the current proof-of-concept milestone.

---

# 14. Next Milestone

After Milestone 2 cleanup and final validation, the next milestone is:

## Milestone 3 — Similar Photo Review UI

Expected areas include:

- similarity-group presentation
- responsive image grid
- group navigation
- selected-photo state
- image preview
- photo details
- UI states for similarity results

The review UI will also make broader real-world visual evaluation practical.

Once groups can be seen directly, larger folders can be tested and judged using both:

```text
algorithmic evidence
+
human visual judgment
```

The exact Milestone 3 scope should be defined in a separate source-of-truth document before implementation begins.

---

# Final Milestone Statement

Milestone 2 is the point where Similens becomes genuinely AI-powered.

Its current validated pipeline is:

```text
Structured local photo paths
            ↓
      Local image decoding
            ↓
      DINOv2 embeddings
            ↓
       Cosine similarity
            ↓
     Threshold >= 0.90
            ↓
Deterministic complete-link grouping
            ↓
Candidate near-duplicate groups
            ↓
Ground-truth validation
```

The current evidence supports:

```text
DINOv2-small
+
384-dimensional CLS embeddings
+
cosine similarity
+
provisional threshold 0.90
+
deterministic complete-link-style grouping
```

as the first Similens similarity-engine configuration.

On the current 38-photo labeled dataset:

```text
703 pairwise comparisons

2 expected positive groups

2 produced positive groups

0 negative-set groups

Ground-truth grouping match: true
```

Five fresh-process benchmark runs produced a representative median total similarity-pipeline time of approximately:

```text
2.92 seconds
```

for the current 38-photo dataset with model files already locally cached.

These results demonstrate that the current approach works as a Milestone 2 proof of concept.

They do **not** demonstrate universal production accuracy or large-scale production performance.

The similarity threshold, grouping strategy, and model choice remain open to future evidence.

The Milestone 2 implementation, cleanup, and final regression validation are complete.

The validated similarity engine is now ready to become the technical foundation for Milestone 3 — Similar Photo Review UI.