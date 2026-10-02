# Similens — Milestone 2: AI Similarity Engine

**Document type:** Source of Truth  
**Project:** Similens  
**Milestone:** 2 — AI Similarity Engine  
**Status:** Planned  
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

Unless experiments show a real technical problem, Milestone 2 starts with these decisions:

- AI inference remains local.
- No paid/cloud AI API is used.
- DINOv2-small is the initial pretrained visual-feature model candidate.
- CLIP may be evaluated as a comparison model if useful.
- pHash or an equivalent perceptual-hash method is used as a lightweight baseline.
- ONNX-compatible local inference is preferred.
- Transformers.js and/or ONNX Runtime may be used for model execution.
- Similarity should be based on image features/embeddings rather than filenames.
- Threshold values must be calibrated experimentally rather than guessed.
- Final delete/keep decisions remain outside the AI engine.

These are starting assumptions, not guaranteed final winners.

If an experiment shows that another method is materially better for Similens' exact use case, update this document before changing direction.

---

# 4. Architecture for Milestone 2

The intended high-level flow is:

```text
Photo paths from Milestone 1
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

A likely code boundary is:

```text
src/
├── main/
│   ├── services/
│   │   ├── photoScanner.ts
│   │   └── similarity/
│   │       ├── ...
│
├── shared/
│   └── types/
│       ├── photo.ts
│       └── similarity.ts
│
└── renderer/
```

The exact internal folder structure can evolve as implementation begins.

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

Create a dataset outside normal personal-photo folders.

Suggested structure:

```text
similarity-evaluation/
├── group-01/
├── group-02/
├── group-03/
├── hard-negatives/
└── unrelated/
```

The exact physical folder structure can change if a metadata file is easier to manage.

### 1.2 Collect positive near-duplicate groups

Include several real groups such as:

- same burst
- same pose with small movement
- same scene with slightly different framing
- eyes open vs closed
- small camera motion
- slight exposure differences

Aim for multiple group sizes, for example:

```text
Group A → 3 photos
Group B → 5 photos
Group C → 7 photos
```

### 1.3 Collect hard negatives

Hard negatives are important.

Examples:

- same person, same place, different moment
- same room, different pose
- same landscape, noticeably different composition
- similar subject but not the same shot

These should **not** be grouped as near-duplicates.

### 1.4 Collect unrelated negatives

Include clearly unrelated photos:

- portrait
- landscape
- screenshot
- food photo
- building
- document photo

These help detect obvious false positives.

### 1.5 Define ground truth

Create a small source-of-truth representation describing which photos belong together.

Possible format:

```json
{
  "groups": [
    ["a1.jpg", "a2.jpg", "a3.jpg"],
    ["b1.jpg", "b2.jpg"]
  ]
}
```

The exact format should be simple and easy to maintain.

### 1.6 Keep the dataset private if it contains personal photos

Do **not** commit personal evaluation photos to the public repository.

Only commit:

- reusable test metadata,
- synthetic/public sample assets if appropriate,
- or documentation describing the test setup.

Personal photos should stay local and be ignored by Git.

## Feature 1 Acceptance Criteria

- [ ] A local evaluation dataset exists.
- [ ] It contains multiple positive near-duplicate groups.
- [ ] It contains hard-negative examples.
- [ ] It contains clearly unrelated examples.
- [ ] Ground-truth groups are documented.
- [ ] Personal evaluation images are not accidentally committed to Git.
- [ ] The dataset is large enough to compare at least two similarity approaches meaningfully.

## Feature 1 Validation

Confirm that a human can look at the dataset and answer:

```text
Which photos should belong together?
Which photos should definitely remain separate?
```

If this cannot be answered clearly, the dataset is not ready.

---

# Feature 2 — Baseline Similarity Method

## Goal

Implement a lightweight baseline before adding the neural-network model.

The baseline gives us something measurable to compare the AI model against.

## Initial Baseline

Use perceptual hashing (pHash or a closely related perceptual-image hash).

This is not the final AI solution.

It is a reference point.

## Subtasks

### 2.1 Choose a maintained local perceptual-hash implementation

Requirements:

- works locally,
- compatible with the Electron/Node environment,
- acceptable license,
- no cloud/API dependency.

Do not add a package without reviewing its maintenance status and license.

### 2.2 Create a baseline similarity service

Keep it separate from the final embedding model.

Conceptual API:

```text
generatePerceptualHash(imagePath)
comparePerceptualHashes(hashA, hashB)
```

### 2.3 Run the baseline against the evaluation dataset

Record:

- positive pairs detected correctly,
- hard negatives incorrectly matched,
- obvious negatives,
- rough execution time.

### 2.4 Record baseline findings

Document observations such as:

```text
Works well for:
- almost identical images
- small compression changes

Struggles with:
- crop changes
- larger pose changes
- meaningful scene movement
```

Actual conclusions must come from experiments.

## Feature 2 Acceptance Criteria

- [ ] A working local perceptual-hash baseline exists.
- [ ] It can compare two photos.
- [ ] It has been tested on positive groups.
- [ ] It has been tested on hard negatives.
- [ ] Results are recorded.
- [ ] No claim is made that the baseline is the final similarity method.

---

# Feature 3 — Local Vision Model Integration

## Goal

Run a pretrained vision model locally and generate an embedding for a photo.

The initial model candidate is DINOv2-small.

## Subtasks

### 3.1 Confirm the exact model package/artifact

Before implementation, verify:

- model repository
- model version
- model format
- license
- approximate model size
- expected input format
- expected embedding dimension
- compatibility with the chosen JS/ONNX runtime

Record the exact model identity in project documentation.

### 3.2 Install the minimum inference dependencies

Add only the packages required for the chosen local inference path.

Possible components include:

- Transformers.js
- ONNX Runtime

Avoid adding overlapping runtimes without a reason.

### 3.3 Create a dedicated model-loading service

Keep model setup outside UI code.

Conceptual responsibility:

```text
loadSimilarityModel()
```

The service should avoid reloading the model for every photo.

### 3.4 Create image preprocessing

Convert a photo into the format required by the model.

Possible responsibilities:

- decoding
- resize
- normalization
- channel ordering

Prefer library/model-provided preprocessing when available instead of manually recreating it.

### 3.5 Generate a single image embedding

Conceptual API:

```text
generateImageEmbedding(imagePath)
```

Output should be a numeric vector.

### 3.6 Verify deterministic behavior

Running embedding extraction repeatedly on the same unchanged image should produce the same or effectively identical output.

### 3.7 Test several image formats

At minimum test:

- JPEG
- PNG

HEIC support must be evaluated separately because decoding support may differ across the chosen image/model tooling.

If HEIC requires a conversion/decoder step, document the decision rather than silently dropping support.

### 3.8 Keep model inference local

Verify:

- images are not uploaded,
- no remote inference endpoint is called,
- model execution happens on the user's machine.

If model files are downloaded on first use during development, distinguish **model download** from **image upload**.

## Feature 3 Acceptance Criteria

- [ ] Exact pretrained model is documented.
- [ ] Model license is reviewed.
- [ ] Model loads locally.
- [ ] Model is not reloaded unnecessarily for each photo.
- [ ] A JPEG can produce an embedding.
- [ ] A PNG can produce an embedding.
- [ ] HEIC behavior is tested and documented.
- [ ] Embedding has the expected shape/dimension.
- [ ] Same image produces stable results.
- [ ] Personal image data is not sent to a remote inference API.
- [ ] Build/type checks pass.

---

# Feature 4 — Embedding Similarity & Threshold Calibration

## Goal

Turn embeddings into a useful similarity signal and determine practical thresholds using real data.

## Subtasks

### 4.1 Define the similarity function

The initial candidate is cosine similarity.

Conceptual API:

```text
calculateSimilarity(embeddingA, embeddingB)
```

Do not expose the result as a fake probability unless it is actually calibrated as one.

### 4.2 Verify basic similarity behavior

Test:

- same image vs itself
- near-duplicate pair
- hard-negative pair
- unrelated pair

Expected ordering:

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

Exact values must come from experiments.

### 4.3 Generate pairwise evaluation results

For the labeled evaluation set, record similarity scores for:

- positive pairs
- hard negatives
- unrelated negatives

### 4.4 Inspect score distributions

Determine whether positive and negative examples separate clearly enough.

Do not pick a threshold from intuition alone.

### 4.5 Test candidate thresholds

For each threshold, record:

- true positives
- false positives
- false negatives
- true negatives where useful

Use a small table or script output.

### 4.6 Choose an initial internal threshold

Select a threshold that works reasonably on the current evaluation set.

Document:

- model used
- dataset used
- chosen threshold
- known failure cases

This threshold is provisional.

### 4.7 Compare AI embeddings against the baseline

Compare at least:

```text
DINOv2-small embedding approach
vs
perceptual-hash baseline
```

CLIP may be added if the first comparison leaves uncertainty.

The goal is not to benchmark every model available.

The goal is to establish a justified choice for Similens.

## Feature 4 Acceptance Criteria

- [ ] Embedding similarity function exists.
- [ ] Same-image similarity behaves as expected.
- [ ] Positive and negative pairs have been measured.
- [ ] Threshold experiments are recorded.
- [ ] False positives are inspected manually.
- [ ] False negatives are inspected manually.
- [ ] An initial threshold is selected based on evidence.
- [ ] AI approach is compared against the baseline.
- [ ] Final choice is documented with limitations.

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

It should report enough information to compare versions.

### 6.2 Measure quality on the labeled dataset

At minimum record:

- correct positive matches
- false positives
- false negatives
- group-level failures

Formal ML metrics may be added if useful.

Useful candidates include:

- precision
- recall
- F1

Do not add metrics only for appearance; use them if they help decisions.

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

Persistent embedding caching belongs to a later optimization milestone unless it becomes necessary now.

### 6.7 Verify local-only processing

Confirm there is no photo upload or remote inference request.

### 6.8 Run full production validation

Run:

```bash
npm run build
```

and the relevant lint/typecheck commands.

## Feature 6 Acceptance Criteria

- [ ] Evaluation workflow is repeatable.
- [ ] Similarity quality is measured on labeled data.
- [ ] Important false positives are reviewed.
- [ ] Important false negatives are reviewed.
- [ ] Basic performance is recorded.
- [ ] The chosen model/threshold/grouping configuration is documented.
- [ ] Local-only inference is verified.
- [ ] Production build/type validation passes.
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

- [ ] Labeled local evaluation dataset exists.
- [ ] Positive near-duplicate groups exist.
- [ ] Hard negatives exist.
- [ ] Unrelated negatives exist.
- [ ] Ground truth is documented.
- [ ] Private test photos are excluded from Git.

## Baseline

- [ ] Perceptual-hash baseline exists.
- [ ] Baseline results are recorded.
- [ ] Baseline limitations are understood.

## AI Model

- [ ] Exact model is documented.
- [ ] Model licensing is reviewed.
- [ ] Model runs locally.
- [ ] Image embeddings are generated.
- [ ] Supported decoding behavior is documented.
- [ ] No remote image inference occurs.

## Similarity

- [ ] Similarity calculation works.
- [ ] Positive and negative score behavior is measured.
- [ ] Threshold experiments are complete.
- [ ] Initial threshold is evidence-based.
- [ ] False positives are reviewed.
- [ ] False negatives are reviewed.

## Grouping

- [ ] Similar photos can be grouped.
- [ ] Unrelated singleton images are excluded.
- [ ] Transitive similarity behavior is tested.
- [ ] Group output is deterministic.
- [ ] Structured group result exists for future UI use.

## Quality

- [ ] Baseline vs AI comparison is documented.
- [ ] Basic performance is measured.
- [ ] Build/type checks pass.
- [ ] No known crash in the evaluation workflow.
- [ ] Known limitations are documented.

## Scope Discipline

- [ ] No photo deletion has been implemented.
- [ ] No best-photo scoring has been implemented.
- [ ] No final review gallery has been implemented.
- [ ] No cloud AI API has been introduced.
- [ ] No unnecessary custom model training has been introduced.

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
feat: integrate local image embedding model
feat: add embedding similarity evaluation
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

## Protect personal data

Evaluation photos may be personal.

Rules:

- keep personal test images local,
- do not commit them,
- do not upload them to external AI APIs,
- use Git ignore rules when needed.

## Prefer evidence over architecture complexity

Start simple.

Only add:

- more models,
- more clustering algorithms,
- vector indexes,
- caching layers,

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

The milestone is complete when the grouping is technically usable, experimentally justified, locally executed, and ready to be consumed by the review UI.
