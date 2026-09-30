# Similens

> **Local AI for smarter photo culling.**

Similens is a planned cross-platform desktop application for finding and reviewing **visually similar and near-duplicate photos** using local AI.

The main goal is simple: when a folder contains several almost-identical photos from the same moment, Similens should group those photos together so the user can quickly compare them, keep the ones they want, and move the rest to Trash.

The project is being designed as a personal pet project and learning project around practical AI engineering, computer vision, desktop development, similarity search, clustering, and human-in-the-loop decision making.

## The Problem

Photo collections often contain many images that are technically different files but are visually almost the same.

A common example:

- A person takes 5–6 photos of the same scene.
- One photo may contain closed eyes.
- Another may have slight motion blur.
- Someone may be looking away in another.
- The intention is to keep the best one or two photos and delete the rest.
- The cleanup never happens.
- Months or years later, the collection contains hundreds or thousands of near-duplicate photos.

Traditional duplicate-file tools are not enough because these images are **not exact duplicates**. Their file hashes are different and their pixels are not identical.

Similens is intended to solve the more useful question:

> **Which photos look like they belong to the same shot, burst, scene, or moment?**

## Why Similens?

The project has two goals.

### 1. Solve a real personal problem

The original motivation is a large personal photo collection containing many groups of near-identical photos that are difficult and time-consuming to clean manually.

### 2. Build a real AI-powered application

Instead of using AI only in notebooks or isolated experiments, Similens is intended to explore how a computer-vision model can be integrated into a complete desktop product.

The project will involve:

- image feature extraction,
- embeddings,
- similarity measurement,
- clustering,
- threshold calibration,
- local inference,
- file-system operations,
- caching,
- desktop UX,
- performance optimization,
- and human-in-the-loop AI.

---

# MVP Scope

The first version will focus on **one problem only**:

> Detect visually similar photos and group them for manual review.

The MVP will **not** try to automatically decide which photo should be kept.

## Planned MVP Features

- Select a local folder containing photos.
- Scan supported image files inside the selected folder.
- Generate a visual representation/embedding for each image.
- Compare images for visual similarity.
- Group near-duplicate or highly similar photos.
- Show **only similar-photo groups**, not every unique photo.
- Display groups in a vertically scrollable review interface.
- Display photos inside each group using a responsive grid.
- Open a larger preview of an image.
- Show basic photo details.
- Reveal a photo in the operating system's file manager.
- Select one or multiple photos.
- Move selected photos to the operating system's Trash/Recycle Bin.
- Adjust similarity sensitivity.
- Show scan progress and a scan summary.
- Keep all image analysis local on the user's computer.

Example scan summary:

```text
1,842 photos scanned
37 similar-photo groups found
```

---

# Expected User Flow

```text
Open Similens
      ↓
Select a photo folder
      ↓
Start analysis
      ↓
Scan images
      ↓
Generate image embeddings
      ↓
Find similar images
      ↓
Create similarity groups
      ↓
Review groups
      ↓
Select unwanted photos
      ↓
Move selected photos to Trash
```

The application should never require the user to manually browse the original folder just to perform the cleanup.

---

# Example Review Group

```text
Group 12

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Photo A  │ │ Photo B  │ │ Photo C  │ │ Photo D  │
│    □     │ │    ☑     │ │    ☑     │ │    □     │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌──────────┐
│ Photo E  │
│    ☑     │
└──────────┘
```

The user remains responsible for the final decision.

---

# Core Product Principle

Similens should assist the user, not make destructive decisions for them.

A technically imperfect image may still have personal or emotional value. Because of that:

- the AI may detect,
- rank,
- score,
- or explain,

but the user should remain in control of what is kept or removed.

For the MVP, deletion should mean **Move to Trash / Recycle Bin**, not permanent deletion.

---

# Technology Stack

## Desktop Application

- **Electron**
- **React**
- **TypeScript**
- **Node.js**
- **Vite**

### Why Electron?

Electron allows the project to use one JavaScript/TypeScript codebase for:

- macOS,
- Windows,
- Linux.

It also gives the application access to Node.js capabilities needed for local file-system operations.

The first development and testing target will likely be **macOS**, while keeping the architecture cross-platform from the beginning.

---

# AI / Computer Vision Stack

The planned AI pipeline is intentionally platform-neutral.

The project should not depend on Apple Vision or another operating-system-specific computer-vision API.

Initial stack:

- **Pretrained vision model**
- **ONNX**
- **ONNX Runtime**
- **Transformers.js**
- **Cosine similarity**
- **Clustering**

---

# Planned Similarity Pipeline

The first implementation may look roughly like this:

```text
Photo Folder
     ↓
File Scanner
     ↓
Image Preprocessing
     ↓
Feature Extraction
     ↓
DINOv2-small
     ↓
Image Embeddings
     ↓
Similarity Calculation
     ↓
Clustering
     ↓
Similar-Photo Groups
     ↓
React Review UI
```

---

# Similarity Controls

A raw number such as "90% similarity" can be misleading if it is not a true probability.

The UI may therefore expose simple levels such as:

```text
Strict
Balanced
Loose
```

An advanced mode could later expose the underlying numerical threshold.

---

# Clustering

Pairwise similarity alone is not enough.

Example:

```text
A is very similar to B
B is very similar to C
A is only moderately similar to C
```

The application still needs to decide whether A, B, and C belong to one group.

Possible clustering approaches to evaluate:

- graph-based connected components,
- hierarchical clustering,
- DBSCAN,
- threshold-based grouping.

The final method will be chosen after testing on real photo collections.

---

# Scaling Strategy

A naive implementation comparing every image with every other image has approximately:

```text
O(n²)
```

pairwise comparisons.

That may be acceptable for small collections but becomes inefficient as the library grows.

Possible future optimizations include:

- perceptual-hash pre-filtering,
- EXIF capture-time filtering,
- image-dimension filtering,
- approximate nearest-neighbor search,
- cached embeddings,
- incremental rescanning.

---

# Embedding Cache

Image embeddings do not need to be generated again every time if the source file has not changed.

A future local cache may store information such as:

```text
File path
File size
Modified timestamp
Image dimensions
Embedding
Model version
```

A lightweight local database such as **SQLite** is a likely option.

---

# Privacy

Privacy is an important design goal.

The planned architecture performs image analysis **locally**.

```text
Personal photo
      ↓
Local model
      ↓
Local embedding
      ↓
Local similarity analysis
```

The application should not require photos to be uploaded to a cloud AI service.

Benefits:

- no AI API cost,
- offline operation,
- lower privacy risk,
- predictable performance,
- no external image storage.

---

# Cross-Platform Architecture

The core AI logic should not know which operating system it is running on.

```text
┌──────────────────────────────┐
│       React + TypeScript     │
│                              │
│ Folder Selection             │
│ Review UI                    │
│ Preview                      │
│ Selection                    │
└──────────────┬───────────────┘
               │
               │ IPC
               ▼
┌──────────────────────────────┐
│      Electron / Node.js      │
│                              │
│ File Scanner                 │
│ Metadata                     │
│ Thumbnails                   │
│ File Operations              │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│          AI Engine           │
│                              │
│ Image preprocessing          │
│ Embedding generation         │
│ Similarity                   │
│ Clustering                   │
└──────────────────────────────┘
```

This separation should make it easier to replace:

- the model,
- the clustering algorithm,
- or even the desktop framework

without rewriting the entire application.

---

# Model Evaluation Plan

The final model should be selected through experiments instead of assumptions.

A small manually labeled dataset will be created from real photos.

Example categories:

### Positive group

Photos from the same burst or moment.

### Hard negative group

Photos of the same people/location but taken at a different moment.

### Negative group

Clearly unrelated photos.

Initial comparison candidates:

```text
DINOv2-small
vs
CLIP
vs
pHash baseline
```

Possible evaluation criteria:

- correct near-duplicate grouping,
- false-positive rate,
- false-negative rate,
- inference speed,
- memory consumption,
- model size,
- cross-platform behavior.

Future experiments may include other vision foundation models such as DINOv3.

---

# V2 — Photo Quality Assistance

After similarity grouping works reliably, the next major feature will be **quality analysis**.

Instead of automatically selecting a winner, Similens may provide quality indicators for each photo.

Possible signals:

- sharpness,
- motion blur,
- exposure,
- contrast,
- face visibility,
- eye state,
- face quality,
- composition,
- resolution.

Example:

```text
Photo A

Sharpness       88
Exposure        82
Face Quality    94
Composition     76
-------------------
Overall         89
```

The exact scoring formula has not been defined.

The user will still make the final decision.

---

# Explainable Recommendations

A future version should prefer explanations over mysterious scores.

Example:

```text
Photo A — 91
Sharper face · better exposure · less motion blur

Photo B — 87
Good exposure · slight face blur

Photo C — 71
Subject sharp · one face poorly captured
```

This is preferable to simply saying:

> "Delete Photo B and Photo C."

---

# Roadmap

## Phase 0 — Planning

- Define the problem.
- Choose the project name: **Similens**.
- Define MVP scope.
- Choose Electron + React + TypeScript.
- Choose local AI inference.
- Select DINOv2-small as the first model candidate.
- Define CLIP and pHash as comparison baselines.
- Define cross-platform architecture.
- Create the repository.
- Scaffold the application.

## Phase 1 — Technical Prototype

- Select a local folder.
- Discover supported image files.
- Load a local vision model.
- Generate one embedding per image.
- Calculate pairwise similarity.
- Print similarity results for a small test dataset.
- Evaluate DINOv2-small against baselines.

## Phase 2 — Similarity Engine

- Implement grouping/clustering.
- Tune similarity thresholds.
- Handle false-positive groups.
- Add embedding caching.
- Add scan progress reporting.

## Phase 3 — MVP Interface

- Build the group review screen.
- Add image previews.
- Add multi-selection.
- Add photo details.
- Add "Reveal in Finder / Explorer".
- Add "Move to Trash / Recycle Bin".
- Add similarity sensitivity control.
- Add scan summary.

## Phase 4 — Cross-Platform Validation

- macOS testing.
- Windows testing.
- Linux testing.
- Platform-specific file-operation validation.
- Packaging.

## Phase 5 — Quality Intelligence

- Sharpness analysis.
- Blur analysis.
- Exposure analysis.
- Face-quality analysis.
- Eye-state analysis.
- Explainable quality scores.
- Side-by-side quality comparison.

## Phase 6 — Future Ideas

- Faster similarity search for very large libraries.
- Incremental folder rescanning.
- More model benchmarks.
- Model quantization.
- GPU acceleration where practical.
- Configurable image formats.
- Session history.
- Undo-friendly cleanup workflow.

---

# MVP Non-Goals

The following are intentionally **not** part of the first MVP:

- automatic deletion,
- automatic "best photo" selection,
- face recognition / person identification,
- cloud photo synchronization,
- online AI APIs,
- full photo-library management,
- photo editing,
- image enhancement,
- semantic image search,
- mobile apps.

Keeping the first scope narrow should make it easier to validate the most important technical question:

> **Can the application reliably detect and group near-duplicate personal photos?**

---

# Planned Repository Structure

The exact structure may change after the initial scaffold.

```text
similens/
├── src/
│   ├── main/
│   │   ├── filesystem/
│   │   ├── ipc/
│   │   └── index.ts
│   │
│   ├── renderer/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   └── app.tsx
│   │
│   ├── ai/
│   │   ├── models/
│   │   ├── embeddings/
│   │   ├── similarity/
│   │   └── clustering/
│   │
│   ├── shared/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── database/
│
├── tests/
├── scripts/
├── docs/
├── assets/
├── README.md
└── package.json
```

---

# Development Setup

Run these commands from the root of your local repository.

Install the project dependencies:

```bash
npm install
```

Start the Electron application in development mode:

```bash
npm run dev
```

Run TypeScript checks and compile the application for production into `out/`:

```bash
npm run build
```

---

# Model Distribution

Large model binaries should not normally be committed directly to the main Git repository.

Possible strategies:

### Development

Download the selected pretrained model and cache it locally.

### Packaged application

Bundle the chosen model with the desktop application or download it during initial setup.

The final approach will depend on:

- package size,
- model licensing,
- offline requirements,
- and release strategy.

---

# Supported Image Formats

Initial target formats:

- JPEG / JPG
- PNG
- HEIC

Additional formats may be added after testing.

---

# Safety Around File Deletion

Photo cleanup is destructive if implemented carelessly.

The application should therefore follow several rules:

- default to moving files to Trash / Recycle Bin,
- avoid permanent deletion in the MVP,
- clearly show selected files,
- require an explicit user action,
- preserve the original file until the user confirms removal,
- keep AI recommendations separate from user decisions.

---

# Testing Strategy

Testing should cover both software behavior and AI behavior.

## Application Tests

- folder scanning,
- supported file detection,
- image loading,
- metadata extraction,
- file operations,
- IPC communication,
- selection state,
- Trash / Recycle Bin behavior.

## AI Tests

- known near-duplicate groups,
- visually similar but different scenes,
- same people in different moments,
- lighting changes,
- small camera movement,
- crop changes,
- resolution changes,
- screenshots versus photographs,
- false-positive groups.

---

# Learning Goals

Similens is also intended as a practical AI engineering project.

Areas to explore:

- computer vision,
- vision transformers,
- pretrained foundation models,
- image embeddings,
- cosine similarity,
- perceptual hashing,
- clustering,
- model evaluation,
- inference optimization,
- ONNX,
- local model deployment,
- Electron architecture,
- cross-platform file systems,
- human-in-the-loop AI,
- privacy-aware product design.

---

# Possible Future Architecture Improvements

As the application grows, the similarity engine may evolve from:

```text
Every image
   ↓
Compare with every other image
```

to something closer to:

```text
Image
   ↓
Metadata / pHash candidate filter
   ↓
Embedding search
   ↓
Nearest candidates
   ↓
Fine similarity check
   ↓
Clustering
```

This would make large libraries much more practical.

---

# Name

**Similens** combines the ideas of:

- **similarity**
- and a photographic **lens**

The name reflects the central purpose of the project: using computer vision to look through a photo collection and find images that are visually related.

---

# Tagline

> **Local AI for smarter photo culling.**

---

# License

A license has not been selected yet.

Before any public or commercial distribution, the project should review:

- application source-code licensing,
- pretrained model licensing,
- model redistribution terms,
- third-party package licenses.

---

# Contributing

Similens is currently a personal learning and portfolio project.

Contribution guidelines may be added if the repository becomes open for external contributions.

---

# Disclaimer

Similens is currently under planning and development.

Features, models, algorithms, architecture, and UI described in this README represent the current project direction and may change as experiments provide better evidence.

The application should always be tested on non-critical copies of photo collections before being trusted with important personal files.

---

## Short Summary

**Similens** is a cross-platform, privacy-focused desktop application planned around React, TypeScript, Electron, Node.js, and local AI inference.

Its first goal is intentionally narrow:

> **Find near-duplicate photos, group them, and make cleanup easier—without taking the final decision away from the user.**
