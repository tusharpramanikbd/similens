# Similens — Milestone 2: AI Similarity Engine

**Document type:** Source of Truth  
**Project:** Similens  
**Milestone:** 2 — AI Similarity Engine  
**Status:** In Progress  
**Purpose:** Define the exact scope, experiments, implementation tasks, acceptance criteria, and testing requirements for the first AI-powered similarity engine in Similens.

---

## 1. Milestone Goal

Milestone 2 introduces the first AI/computer-vision capability into Similens.

By the end of this milestone, Similens should be able to:

1. Take the supported local photo paths discovered in Milestone 1.
2. Generate a visual representation for each photo.
3. Compare photos based on visual similarity.
4. Identify likely near-duplicate photos from the same shot, burst, scene, or moment.
5. Group similar photos into candidate similarity groups.
6. Avoid grouping clearly unrelated photos.
7. Keep all inference local on the user's computer.
8. Produce structured similarity-group data that the review UI can use in Milestone 3.

This milestone is about building and validating the **similarity engine**.

It is not about designing the final review interface or deleting photos.

---

# 2. Milestone Scope

## Included

- Small labeled evaluation dataset
- Ground-truth similarity groups
- A lightweight non-AI baseline
- Local pretrained vision model integration
- Image preprocessing
- Image embedding generation
- Embedding normalization where required
- Similarity calculation
- Threshold experiments
- Model/baseline comparison
- Similarity-group generation
- Basic clustering/grouping strategy
- Duplicate/near-duplicate candidate evaluation
- False-positive and false-negative analysis
- Performance measurement on a small/medium dataset
- Local-only inference
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
- automatic model fine-tuning
- custom model training
- background folder watching
- final cross-platform packaging optimization

Those belong to later milestones.

---

# 3. Locked Technical Direction

The current validated technical direction is:

- AI inference remains local.
- No paid/cloud AI API is used.
- DINOv2-small is the selected primary visual-feature model for the current implementation.
- The exact model artifact is `onnx-community/dinov2-small`, based on `facebook/dinov2-small`.
- pHash is retained as the lightweight non-AI baseline and comparison reference.
- CLIP may still be evaluated later if future datasets reveal uncertainty, but the current DINOv2 vs pHash evaluation does not require another model comparison.
- ONNX-compatible local inference is preferred.
- Transformers.js is used for the current DINOv2 inference path.
- Similarity is based on image features/embeddings rather than filenames.
- Cosine similarity is used to compare DINOv2 embeddings.
- The current provisional DINOv2 cosine-similarity threshold is `0.90`.
- Threshold values are calibrated experimentally rather than guessed.
- Thresholds remain provisional and must be revisited when the evaluation dataset becomes larger or more diverse.
- Final delete/keep decisions remain outside the AI engine.

The current model choice is based on the evaluation dataset available during Milestone 2.

It must not be interpreted as proof that DINOv2 will achieve perfect accuracy on all production photo collections.

If future evaluation reveals a material weakness, the model, threshold, or comparison strategy should be reassessed before changing the production direction.

---

# 4. Architecture for Milestone 2

The intended high-level flow is:

```text
Photo paths from Milestone 1
            ↓
      Image decoding
            ↓
      Image preprocessing
            ↓
   Visual feature extraction
            ↓
        Embeddings
            ↓
   Similarity calculation
            ↓
 Threshold / grouping logic
            ↓
 Candidate similar-photo groups
            ↓
 Structured result for renderer
```

The AI engine should remain separate from React UI concerns.

The current implementation boundary includes:

```text
src/
├── main/
│   ├── services/
│   │   ├── photoScanner.ts
│   │   ├── imageDecoder.ts
│   │   └── similarity/
│   │       ├── perceptualHash.ts
│   │       ├── imageEmbedding.ts
│   │       └── embeddingSimilarity.ts
│
├── shared/
│   ├── constants/
│   │   └── imageFormats.ts
│   └── types/
│       └── photo.ts
│
└── renderer/

scripts/
├── evaluate-phash.ts
├── test-dinov2.ts
└── evaluate-dinov2.ts
```

The exact internal folder structure can continue to evolve as later Milestone 2 features are implemented.

---

# 5. Feature Breakdown

Milestone 2 contains six features.

```text
Milestone 2 — AI Similarity Engine

Feature 1 — Evaluation Dataset & Ground Truth
Feature 2 — Baseline Similarity Method
Feature 3 — Local Vision Model Integration
Feature 4 — Embedding Similarity & Threshold Calibration
Feature 5 — Similarity Grouping / Clustering
Feature 6 — Model Evaluation, Performance & Milestone Validation
```

Each feature should be validated before moving to the next one.

---

# Feature 1 — Evaluation Dataset & Ground Truth

## Goal

Create a small, controlled dataset that lets us objectively test whether Similens is detecting the right photos as similar.

Without a labeled test set, similarity thresholds and model choices would be based only on visual guesses.

## Subtasks

### 1.1 Create a dedicated local evaluation folder

The current local dataset lives outside the public repository.

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

Current dataset composition:

```text
group-01                     → 5 positive near-duplicate photos
group-02                     → 5 positive near-duplicate photos
same-person-different-shots  → 5 negative photos
hard-negatives               → 10 negative photos
unrelated                    → 13 negative photos
```

### 1.2 Collect positive near-duplicate groups

Positive examples should represent photos that the production app should genuinely place in the same near-duplicate group.

Examples include:

- same burst
- same pose with small movement
- same moment with small framing changes
- eyes open vs closed
- small camera motion
- slight exposure differences

The current confirmed positive groups are:

```text
group-01 → 5 photos
group-02 → 5 photos
```

Each group contains photos that should belong together in the production app.

### 1.3 Collect hard negatives

Hard negatives are important.

Examples:

- same person, same place, different moment
- same room, different pose
- same landscape, noticeably different composition
- similar subject but not the same shot

These should **not** be grouped as near-duplicates.

The evaluation dataset currently contains two types of difficult negatives:

```text
same-person-different-shots
hard-negatives
```

`same-person-different-shots` contains selfies of the same person but with different camera angles, facial presentation, composition, or background details.

These are intentionally labeled negative because the expected production behavior is to keep them in separate groups.

### 1.4 Collect unrelated negatives

Include clearly unrelated photos such as:

- portrait
- landscape
- screenshot
- food photo
- building
- document photo

These help detect obvious false positives.

### 1.5 Define ground truth

The current ground-truth representation is:

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

### Ground-truth correction during evaluation

The folder now named:

```text
same-person-different-shots
```

was originally labeled:

```text
group-03
```

and was initially treated as a positive near-duplicate group.

During DINOv2 threshold evaluation, the photos in that group produced substantially lower similarity scores than `group-01` and `group-02`.

Manual inspection showed that the five photos were:

- selfies of the same person,
- taken from different camera angles,
- with different facial presentation,
- with meaningful framing/composition differences,
- and with background differences.

The expected Similens production behavior is **not** to place all five photos in the same near-duplicate group.

Therefore, the original `group-03` positive label was incorrect.

The folder was renamed to:

```text
same-person-different-shots
```

and reclassified as a negative evaluation set.

All pHash and DINOv2 metrics used for model comparison were recalculated after this correction.

Metrics calculated using the old `group-03` positive label are obsolete and must not be used for model decisions.

### 1.6 Keep the dataset private if it contains personal photos

Do **not** commit personal evaluation photos to the public repository.

Only commit:

- reusable test metadata,
- synthetic/public sample assets if appropriate,
- or documentation describing the test setup.

Personal photos should stay local and be ignored by Git.

## Feature 1 Acceptance Criteria

- [x] A local evaluation dataset exists.
- [x] It contains multiple positive near-duplicate groups.
- [x] It contains hard-negative examples.
- [x] It contains clearly unrelated examples.
- [x] Ground-truth groups are documented.
- [x] Personal evaluation images are not accidentally committed to Git.
- [x] The dataset is large enough to compare at least two similarity approaches meaningfully.
- [x] Ambiguous ground-truth labels have been manually reviewed and corrected.

## Feature 1 Validation

A human can inspect the current dataset and answer:

```text
Which photos should belong together?
Which photos should definitely remain separate?
```

The current ground truth reflects the intended production behavior rather than simply assuming that photos of the same person belong together.

---

# Feature 2 — Baseline Similarity Method

## Goal

Implement a lightweight baseline before adding the neural-network model.

The baseline gives us something measurable to compare the AI model against.

## Initial Baseline

Use perceptual hashing.

The current implementation uses:

```text
@stabilityprotocol.com/phash
```

Image decoding is handled through the shared image decoder before RGBA pixel data is passed to the pHash implementation.

This is not the final AI solution.

It is a reference point.

## Subtasks

### 2.1 Choose a maintained local perceptual-hash implementation

Requirements:

- works locally
- compatible with the Electron/Node environment
- acceptable license
- no cloud/API dependency

### 2.2 Create a baseline similarity service

The baseline service is implemented separately from the embedding model.

Current responsibilities include:

```text
generatePerceptualHash(imagePath)
comparePerceptualHashes(hashA, hashB)
compareImagesPerceptually(imagePathA, imagePathB)
```

Similarity is represented by Hamming distance.

For pHash:

```text
lower distance = more visually similar
higher distance = less visually similar
```

### 2.3 Run the baseline against the evaluation dataset

The baseline evaluation is repeatable through:

```bash
npm run evaluate:phash
```

### 2.4 Record baseline findings

The corrected evaluation shows that pHash performs well on very similar burst-style photos but has overlap between positive and difficult-negative pairs.

## Baseline Evaluation Results

The following results use the **corrected ground truth**.

Evaluation dataset:

- Positive near-duplicate pairs: 20
- Same-person-different-shot negative pairs: 10
- Hard-negative pairs: 45
- Unrelated negative pairs: 78
- Total negative pairs: 133

Measured pHash Hamming distances:

| Category | Pairs | Min | Max | Average |
| --- | ---: | ---: | ---: | ---: |
| Positive | 20 | 4 | 20 | 11.5 |
| Same person different shots | 10 | 16 | 38 | 27.6 |
| Hard negatives | 45 | 16 | 44 | 29.7 |
| Unrelated | 78 | 22 | 40 | 31.2 |

### Score-distribution finding

Positive pHash distances:

```text
4 → 20
```

Negative pHash distances begin as low as:

```text
16
```

Therefore, the ranges overlap between approximately:

```text
16 → 20
```

A single pHash threshold cannot perfectly separate all positive and negative pairs in the current evaluation dataset.

### pHash Threshold Evaluation

For pHash:

```text
distance <= threshold
→ classify as similar
```

Measured threshold results:

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

### Provisional pHash Threshold

Pure F1 score is highest around threshold `18`.

However, Similens places higher importance on avoiding false-positive grouping.

A false positive could place genuinely different photos into the same candidate near-duplicate group.

For that product objective, the provisional pHash comparison threshold is:

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

This gives zero false positives on the current dataset but misses four genuine positive pairs.

### Initial Findings

The pHash baseline generally assigns lower Hamming distances to genuine near-duplicate photos than to negative examples.

However, the positive and difficult-negative distributions overlap.

The baseline is strong for:

- almost identical images
- small burst-style changes
- small compression or pixel-level changes

It becomes less reliable as meaningful visual variation increases.

Because pHash cannot achieve both zero false positives and full positive recall on the current dataset, it remains a useful lightweight baseline rather than the selected primary similarity method.

## Feature 2 Acceptance Criteria

- [x] A working local perceptual-hash baseline exists.
- [x] It can compare two photos.
- [x] It has been tested on positive groups.
- [x] It has been tested on difficult negatives.
- [x] It has been tested on unrelated negatives.
- [x] Corrected ground-truth results are recorded.
- [x] Candidate pHash thresholds have been evaluated.
- [x] Baseline limitations are understood.
- [x] No claim is made that the baseline is the final similarity method.

---

# Feature 3 — Local Vision Model Integration

## Goal

Run a pretrained vision model locally and generate an embedding for a photo.

The selected model for the current implementation is DINOv2-small.

## Implemented Model Configuration

Current model:

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

Current inference precision:

```text
FP32
```

Approximate full FP32 ONNX model size:

```text
~88.5 MB
```

Embedding dimension:

```text
384
```

The FP32 model is intentionally used during initial evaluation so that baseline correctness measurements are not affected by quantization.

## Subtasks

### 3.1 Confirm the exact model package/artifact

The current model artifact and runtime have been verified.

The DINOv2 ONNX model does not expose a dedicated pooled output compatible with the generic `pool: true` option.

Instead, Similens uses the final hidden state of the first token — the DINOv2 CLS token — as the image-level representation.

The resulting embedding contains:

```text
384 values
```

### 3.2 Install the minimum inference dependencies

The current local inference path uses Transformers.js.

The implementation avoids adding multiple overlapping inference runtimes without a concrete need.

### 3.3 Create a dedicated model-loading service

Model loading is kept outside UI code.

The current implementation reuses the model-loading promise inside the process instead of loading a new model instance for every image.

Conceptually:

```text
first embedding request
        ↓
initialize DINOv2 pipeline
        ↓
reuse loaded pipeline
        ↓
later embedding requests
```

Transformers.js may also maintain its own filesystem model cache.

The in-process loader cache and the library's filesystem cache serve different purposes.

### 3.4 Create image preprocessing

Image decoding is centralized in:

```text
src/main/services/imageDecoder.ts
```

Supported images are converted to raw RGBA data.

The decoded image is then converted to RGB before being passed into the DINOv2 pipeline.

Model-provided preprocessing handles the model-specific resizing, normalization, and tensor preparation.

### 3.5 Generate a single image embedding

Implemented conceptual API:

```text
generateImageEmbedding(imagePath)
```

Output:

```text
number[384]
```

### 3.6 Verify deterministic behavior

Repeated embedding generation for the same unchanged image produced identical embedding values during the current evaluation.

Example validation:

```text
Repeated embedding matches: true
```

### 3.7 Test several image formats

The current supported formats are:

- JPEG
- PNG
- WEBP
- HEIC

All four have successfully produced 384-dimensional DINOv2 embeddings.

### 3.8 Keep model inference local

Personal image data is processed locally.

The model files may be downloaded from Hugging Face during model setup or initial development use.

This is different from image inference.

Similens does **not** upload the user's photo to a remote inference endpoint.

## Feature 3 Acceptance Criteria

- [x] Exact pretrained model is documented.
- [x] Model license is reviewed.
- [x] Model loads locally.
- [x] Model is not reloaded unnecessarily for each photo.
- [x] A JPEG can produce an embedding.
- [x] A PNG can produce an embedding.
- [x] A WEBP image can produce an embedding.
- [x] HEIC decoding is supported through the shared image decoder.
- [x] Embedding has the expected 384-dimensional shape.
- [x] Same image produces stable results.
- [x] Unsupported image formats fail with a controlled error.
- [x] Personal image data is not sent to a remote inference API.
- [x] Build/type checks pass.

## Image Format Handling

The current supported image formats are:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.heic`

The supported extension list is centralized in:

```text
src/shared/constants/imageFormats.ts
```

Image decoding is centralized through a shared decoder layer.

JPEG, PNG, and WEBP currently use Sharp.

HEIC uses:

```text
heic-decode
```

because the default Sharp/libvips build used during development does not include the HEVC decoder required by the tested HEIC files.

The current decode path is:

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

Similarity and AI services consume the decoded image data instead of implementing format-specific decoding themselves.

Unsupported formats are rejected with a controlled error before being passed into an image-processing library.

This design keeps the decoding boundary extensible so additional formats can be added in future versions without rewriting the similarity pipeline.

---

# Feature 4 — Embedding Similarity & Threshold Calibration

## Goal

Turn embeddings into a useful similarity signal and determine practical thresholds using real data.

## Subtasks

### 4.1 Define the similarity function

The implemented similarity function is cosine similarity.

Current API:

```text
calculateCosineSimilarity(embeddingA, embeddingB)
```

For the DINOv2 representation:

```text
higher cosine similarity
→ more visually similar

lower cosine similarity
→ less visually similar
```

The score is not treated as a probability.

For example:

```text
0.94
```

does **not** mean:

```text
94% probability that the photos are duplicates
```

### 4.2 Verify basic similarity behavior

Initial sanity tests produced:

| Comparison | Cosine similarity |
| --- | ---: |
| Same image vs itself | ~1.0000 |
| Known near-duplicate pair | 0.9550 |
| Hard-negative pair | 0.7025 |
| Unrelated pair | 0.0431 |

The expected ordering was observed:

```text
same image
   ↓ highest

near duplicate
   ↓ high

hard negative
   ↓ lower

unrelated
   ↓ low
```

The same-image calculation produced:

```text
1.0000000000000002
```

because of normal floating-point precision behavior.

Conceptually, the result is:

```text
≈ 1.0
```

### 4.3 Generate pairwise evaluation results

The repeatable DINOv2 evaluation is available through:

```bash
npm run evaluate:dinov2
```

Embeddings are generated once per image during an evaluation run and stored in memory.

Pairwise comparisons reuse the cached embeddings instead of repeatedly running DINOv2 for the same image.

Conceptually:

```text
image paths
    ↓
one embedding per image
    ↓
Map<imagePath, embedding>
    ↓
pairwise cosine comparisons
```

### 4.4 Inspect score distributions

The following results use the corrected ground truth.

| Category | Pairs | Min | Max | Average |
| --- | ---: | ---: | ---: | ---: |
| Positive | 20 | 0.9243 | 0.9783 | 0.9532 |
| Same person different shots | 10 | 0.5718 | 0.8639 | 0.7403 |
| Hard negatives | 45 | 0.4172 | 0.8331 | 0.6197 |
| Unrelated | 78 | -0.0779 | 0.3842 | 0.0418 |

The weakest genuine positive pair scored:

```text
0.9243
```

The strongest negative pair scored:

```text
0.8639
```

Therefore, the current evaluation dataset has a separation gap:

```text
highest negative = 0.8639

        gap

lowest positive  = 0.9243
```

Approximate gap:

```text
0.9243 - 0.8639 = 0.0604
```

This clean gap did not exist in the pHash results.

### 4.5 Test candidate thresholds

For DINOv2:

```text
similarity >= threshold
→ classify as similar
```

Measured threshold results:

| Threshold | TP | FN | FP | TN | Precision | Recall | F1 |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0.60 | 20 | 0 | 32 | 101 | 38.5% | 100.0% | 0.5556 |
| 0.65 | 20 | 0 | 25 | 108 | 44.4% | 100.0% | 0.6154 |
| 0.70 | 20 | 0 | 17 | 116 | 54.1% | 100.0% | 0.7018 |
| 0.75 | 20 | 0 | 10 | 123 | 66.7% | 100.0% | 0.8000 |
| 0.80 | 20 | 0 | 5 | 128 | 80.0% | 100.0% | 0.8889 |
| 0.85 | 20 | 0 | 1 | 132 | 95.2% | 100.0% | 0.9756 |
| 0.90 | 20 | 0 | 0 | 133 | 100.0% | 100.0% | 1.0000 |

### Manual false-positive inspection

At threshold `0.80`, five negative pairs were incorrectly classified as similar.

They came from:

- same-person-different-shots
- hard-negatives

Manual inspection confirmed that these pairs should remain separate in the production application.

Examples included photos of the same person with:

- similar background elements,
- the same curtain or wall,
- different framing,
- different visible body/hand position,
- different camera position,
- or other meaningful composition differences.

This reinforced the decision to use a stricter threshold.

### False-negative inspection and ground-truth correction

During the earlier evaluation, several pairs from the old `group-03` appeared as false negatives.

Manual review showed that the issue was not necessarily model failure.

The original ground-truth label itself was incorrect.

Those photos were moved into:

```text
same-person-different-shots
```

and all evaluation metrics were recalculated.

After the correction, the current positive sets contain no false negatives at the selected threshold.

### 4.6 Choose an initial internal threshold

The current provisional DINOv2 cosine-similarity threshold is:

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

This is a result on the **current small evaluation dataset only**.

It must not be described as:

```text
DINOv2 is 100% accurate
```

or:

```text
Similens will have 100% production accuracy
```

The current positive evaluation set contains only 20 pairwise positive examples from two groups.

Future evaluation should include more:

- burst styles
- people
- camera devices
- lighting conditions
- crops
- body movement
- scene movement
- resolution changes
- difficult near-duplicates

The threshold must be recalibrated if future data reveals overlap around `0.90`.

### 4.7 Compare AI embeddings against the baseline

The final comparison for this feature uses the corrected ground truth.

The comparison prioritizes avoiding false-positive grouping because a false positive can place genuinely different photos into the same candidate duplicate group.

#### pHash baseline

Provisional zero-false-positive-oriented threshold:

```text
distance <= 14
```

Results:

```text
TP = 16
FN = 4
FP = 0
TN = 133

Precision = 100%
Recall = 80%
F1 = 0.8889
```

#### DINOv2

Provisional threshold:

```text
cosine similarity >= 0.90
```

Results:

```text
TP = 20
FN = 0
FP = 0
TN = 133

Precision = 100%
Recall = 100%
F1 = 1.0000
```

#### Side-by-side comparison

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

### Model Selection Decision

On the current corrected evaluation dataset, DINOv2 provides better separation between genuine near-duplicates and difficult negative examples.

pHash has overlapping score distributions:

```text
Positive:
4 → 20

Negative:
starts at 16
```

DINOv2 currently has a clean separation:

```text
highest negative = 0.8639

        gap

lowest positive = 0.9243
```

With a zero-false-positive objective:

```text
pHash
→ misses 4 genuine positive pairs

DINOv2
→ misses 0 genuine positive pairs
```

Therefore, the current selected primary similarity method for Similens is:

```text
DINOv2-small embeddings
+
cosine similarity
+
provisional threshold 0.90
```

pHash remains useful as:

- a lightweight baseline,
- a sanity-check comparison,
- and evidence supporting the decision to use the embedding-based approach.

CLIP does not need to be evaluated at this stage because the current DINOv2 vs pHash comparison provides a sufficiently clear direction.

If a larger future dataset exposes meaningful DINOv2 weaknesses, additional models may then be evaluated.

## Feature 4 Acceptance Criteria

- [x] Embedding similarity function exists.
- [x] Same-image similarity behaves as expected.
- [x] Positive and negative pairs have been measured.
- [x] Threshold experiments are recorded.
- [x] False positives are inspected manually.
- [x] False negatives and apparent false negatives are inspected manually.
- [x] Incorrect ground-truth labeling discovered during evaluation has been corrected.
- [x] An initial threshold is selected based on evidence.
- [x] AI approach is compared against the baseline.
- [x] Final current model choice is documented with limitations.

---

# Feature 5 — Similarity Grouping / Clustering

## Goal

Convert pairwise similarity results into usable candidate groups.

The output should represent groups of photos likely belonging to the same shot/burst/moment.

## Subtasks

### 5.1 Define shared similarity-group types

Create a structured type that can later be consumed by the renderer.

Conceptual example:

```text
SimilarityGroup
- id
- photos[]
```

Only include fields required by the current milestone.

### 5.2 Choose the first grouping strategy

Start with the simplest strategy that behaves correctly on the evaluation dataset.

Possible approaches:

- threshold graph + connected components
- hierarchical clustering
- another simple deterministic method

Do not introduce a complex clustering library unless the simpler approach is insufficient.

### 5.3 Handle transitive similarity carefully

Example:

```text
A ↔ B = highly similar
B ↔ C = highly similar
A ↔ C = borderline
```

Determine whether A/B/C should form one group.

Test this explicitly.

### 5.4 Exclude singleton photos

Milestone 2 output is intended for similar-photo review.

A photo with no sufficiently similar neighbor should not create a one-photo similarity group.

### 5.5 Avoid duplicate membership where possible

A photo should not accidentally appear in multiple equivalent groups because of implementation artifacts.

If overlapping groups are intentionally allowed, document why.

### 5.6 Produce deterministic groups

Running the same unchanged dataset with the same configuration should produce the same grouping.

### 5.7 Return structured groups

Conceptual output:

```json
[
  {
    "id": "group-1",
    "photos": [
      "/path/a.jpg",
      "/path/b.jpg",
      "/path/c.jpg"
    ]
  }
]
```

The exact ID strategy can be simple in this milestone.

## Feature 5 Acceptance Criteria

- [ ] Pairwise similarity can be converted into groups.
- [ ] Groups contain at least two photos.
- [ ] Known positive groups are represented reasonably.
- [ ] Clearly unrelated photos are not grouped.
- [ ] Transitive edge cases are tested.
- [ ] Duplicate/overlapping membership behavior is defined.
- [ ] Group output is deterministic.
- [ ] Group data is structured for later renderer consumption.

---

# Feature 6 — Model Evaluation, Performance & Milestone Validation

## Goal

Validate that the similarity engine is good enough to become the foundation for the review UI.

## Subtasks

### 6.1 Create a repeatable evaluation script or test workflow

The evaluation should be rerunnable after future model/threshold changes.

Current repeatable evaluation commands already include:

```bash
npm run evaluate:phash
npm run test:dinov2
npm run evaluate:dinov2
```

Feature 6 should extend this workflow as necessary once grouping is implemented.

### 6.2 Measure quality on the labeled dataset

At minimum record:

- correct positive matches
- false positives
- false negatives
- group-level failures

Current pairwise evaluation already records:

- true positives
- false positives
- false negatives
- true negatives
- precision
- recall
- F1

Group-level evaluation remains pending until Feature 5 is implemented.

### 6.3 Inspect false positives manually

For each important false positive, ask:

```text
Why did the engine think these belonged together?
```

Examples may include:

- same person
- same background
- same scene
- similar colors
- repeated composition

Record meaningful patterns.

### 6.4 Inspect false negatives manually

For missed near-duplicate groups, inspect:

- large movement
- crop
- lighting
- face change
- camera movement
- rotation
- resolution difference

Also verify that an apparent false negative is not actually a ground-truth labeling problem.

### 6.5 Measure basic performance

Run on at least:

- small test set
- medium test set

Record:

- model load time
- embedding time
- total processing time
- approximate memory behavior if practical

No production-grade benchmark suite is required yet.

### 6.6 Avoid unnecessary repeated inference

Within one run, do not generate the same image embedding repeatedly unless required for testing.

The current DINOv2 evaluation script generates one embedding per image and reuses it for pairwise comparisons.

Persistent embedding caching belongs to a later optimization milestone unless it becomes necessary now.

### 6.7 Verify local-only processing

Confirm there is no photo upload or remote inference request.

Model file download must remain clearly distinguished from image inference.

### 6.8 Run full production validation

Run:

```bash
npm run lint
npm run build
```

and the relevant evaluation commands.

## Feature 6 Acceptance Criteria

- [ ] Evaluation workflow is complete for the final grouping engine.
- [x] Pairwise similarity quality is measured on labeled data.
- [x] Important pairwise false positives are reviewed.
- [x] Important apparent false negatives are reviewed.
- [ ] Basic performance is recorded.
- [ ] The final model/threshold/grouping configuration is documented.
- [x] Local-only image inference is verified.
- [x] Current production build/type validation passes.
- [ ] Engine output is ready for Milestone 3 UI integration.

---

# 6. Milestone 2 End-to-End Acceptance Test

Use the labeled similarity evaluation dataset.

Perform this flow:

1. Start from a clean application/development run.
2. Load or initialize the similarity model.
3. Confirm the model initializes successfully.
4. Process one known image.
5. Confirm an embedding is produced.
6. Process the same image again.
7. Confirm output is stable.
8. Compare an image with itself.
9. Compare a known near-duplicate pair.
10. Compare a hard-negative pair.
11. Compare an unrelated pair.
12. Confirm score ordering is sensible.
13. Run the full labeled dataset.
14. Generate candidate similar-photo groups.
15. Compare produced groups against ground truth.
16. Inspect false positives.
17. Inspect false negatives.
18. Confirm singleton unrelated images are excluded.
19. Confirm same input/configuration produces deterministic grouping.
20. Compare AI results against the perceptual-hash baseline.
21. Confirm no personal image is uploaded to a cloud inference service.
22. Record model/threshold/grouping configuration.
23. Run production build/type validation.

If these tests pass and known limitations are documented, Milestone 2 can be considered functionally complete.

---

# 7. Milestone 2 Definition of Done

Milestone 2 is complete only when **all** of the following are true.

## Evaluation Foundation

- [x] Labeled local evaluation dataset exists.
- [x] Positive near-duplicate groups exist.
- [x] Hard negatives exist.
- [x] Same-person-but-different-shot negatives exist.
- [x] Unrelated negatives exist.
- [x] Ground truth is documented.
- [x] Ambiguous ground truth has been manually reviewed.
- [x] Private test photos are excluded from Git.

## Baseline

- [x] Perceptual-hash baseline exists.
- [x] Baseline results are recorded using corrected ground truth.
- [x] Baseline thresholds are evaluated.
- [x] Baseline limitations are understood.

## AI Model

- [x] Exact model is documented.
- [x] Model licensing is reviewed.
- [x] Model runs locally.
- [x] Image embeddings are generated.
- [x] Supported decoding behavior is documented.
- [x] No remote image inference occurs.

## Similarity

- [x] Similarity calculation works.
- [x] Positive and negative score behavior is measured.
- [x] Threshold experiments are complete for the current dataset.
- [x] Initial threshold is evidence-based.
- [x] False positives are reviewed.
- [x] Apparent false negatives are reviewed.
- [x] Baseline vs AI comparison is documented.
- [x] DINOv2 is selected as the current primary similarity method.

## Grouping

- [ ] Similar photos can be grouped.
- [ ] Unrelated singleton images are excluded.
- [ ] Transitive similarity behavior is tested.
- [ ] Group output is deterministic.
- [ ] Structured group result exists for future UI use.

## Quality

- [x] Baseline vs AI comparison is documented.
- [ ] Basic performance is measured.
- [x] Current build/type checks pass.
- [x] No known crash exists in the current evaluation workflow.
- [x] Current model/threshold limitations are documented.
- [ ] Final grouping-engine validation is complete.

## Scope Discipline

- [x] No photo deletion has been implemented.
- [x] No best-photo scoring has been implemented.
- [x] No final review gallery has been implemented.
- [x] No cloud AI API has been introduced.
- [x] No unnecessary custom model training has been introduced.

---

# 8. Suggested Implementation Order

Follow this order:

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
Similarity Grouping / Clustering
        ↓
Validate groups
        ↓
Commit


Feature 6
Evaluation, Performance & Full Validation
        ↓
Milestone acceptance test
        ↓
Commit
        ↓
Milestone 2 complete
```

Small, meaningful sub-milestone commits are preferred over waiting for an entire feature if a feature becomes large.

---

# 9. Suggested Git Commit Checkpoints

Exact wording may change based on the implementation.

Examples:

```text
chore: add similarity evaluation dataset metadata
feat: add perceptual similarity baseline
feat: add DINOv2, shared decoding, HEIC and WEBP support
feat: add DINOv2 similarity evaluation and threshold calibration
feat: compare DINOv2 and perceptual similarity baselines
feat: group near-duplicate photos
chore: complete milestone 2 validation
```

Commit when a coherent, stable, testable unit is complete.

---

# 10. Important Experimental Rules

## Do not declare a model "best" before testing

A newer or larger model is not automatically better for Similens.

The relevant question is:

```text
Which method best separates our real near-duplicate photos
from visually similar but genuinely different photos?
```

The current evaluation supports DINOv2 over pHash for the present dataset.

This remains an evidence-based current selection rather than a universal claim about every possible model or dataset.

## Do not treat similarity as probability

A score such as:

```text
0.94
```

should not automatically be presented as:

```text
94% probability that these are duplicates
```

unless it has actually been calibrated that way.

## Ground truth must represent product intent

Being:

- the same person,
- in the same room,
- against a similar background,
- or visually related

does not automatically make two photos near-duplicates.

Ground-truth labels must reflect whether the production app should actually place the photos in the same review group.

If evaluation results expose a questionable label, manually inspect the photos before treating the case as a model error.

## Protect personal data

Evaluation photos may be personal.

Rules:

- keep personal test images local
- do not commit them
- do not upload them to external AI APIs
- use Git ignore rules when needed

## Prefer evidence over architecture complexity

Start simple.

Only add:

- more models
- more clustering algorithms
- vector indexes
- caching layers

when an observed limitation justifies them.

---

# 11. Expected Milestone Output

At the end of Milestone 2, Similens should have an internal capability conceptually similar to:

```text
Input:

[
  "/photos/a.jpg",
  "/photos/b.jpg",
  "/photos/c.jpg",
  "/photos/d.jpg"
]

          ↓

Local similarity engine

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

`d.jpg` would remain outside the result if it has no sufficiently similar match.

Milestone 3 will be responsible for presenting these groups to the user.

---

# 12. Next Milestone

After Milestone 2 is complete, the next milestone is:

## Milestone 3 — Similar Photo Review UI

Expected areas:

- similarity-group presentation
- responsive image grid
- group navigation
- selected-photo state
- image preview
- photo details
- UI states for similarity results

The exact Milestone 3 scope should be defined in a separate source-of-truth document before implementation begins.

---

# Final Milestone Statement

Milestone 2 is the point where Similens becomes genuinely AI-powered.

Its job is to transform:

```text
Structured local photo paths
            ↓
    Local visual analysis
            ↓
 Evidence-based similarity
            ↓
 Candidate near-duplicate groups
```

The current evidence supports DINOv2-small embeddings with cosine similarity as the primary pairwise similarity approach.

The current provisional cosine-similarity threshold is:

```text
0.90
```

That threshold is based on the current corrected evaluation dataset and must remain open to recalibration as the dataset grows.

The milestone is complete when grouping is technically usable, experimentally justified, locally executed, performance-validated, and ready to be consumed by the review UI.