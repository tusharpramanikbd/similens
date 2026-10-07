# Similens — Milestone 3: Similar Photo Review UI

**Document type:** Source of Truth  
**Project:** Similens  
**Milestone:** 3 — Similar Photo Review UI  
**Status:** Not Started  
**Purpose:** Integrate the validated Milestone 2 similarity engine into the Electron application and provide a clear local review experience for candidate near-duplicate photo groups.

---

# 1. Milestone Goal

Milestone 3 turns the validated similarity engine into a usable application workflow.

By the end of this milestone, Similens should be able to:

1. Start from photos discovered through the Milestone 1 folder-scanning flow.
2. Run the Milestone 2 similarity pipeline through the application, not only evaluation scripts.
3. Show progress while similarity analysis is running.
4. Present candidate near-duplicate groups visually.
5. Let the user move between groups and inspect their photos.
6. Let the user select photos inside a group for future actions.
7. Let the user preview a photo at a larger size.
8. Show useful photo details where available.
9. Handle empty, loading, success, and error states clearly.
10. Keep filesystem access and AI processing outside the renderer.
11. Keep all photo inference local.
12. Make the similarity result visually reviewable so later thresholds and grouping behavior can be judged with human eyes.

Milestone 3 is about **application integration + visual review**.

It is not yet about deleting photos or automatically deciding which photo should be kept.

---

# 2. Milestone Scope

## Included

- production integration of the Milestone 2 similarity engine
- renderer → preload → IPC → main-process similarity flow
- similarity-analysis progress states
- candidate-group result screen
- group summary information
- responsive thumbnail grid
- group navigation
- per-photo selection state
- larger photo preview
- basic photo details
- empty-result state
- similarity-analysis error state
- rerun / return-to-folder workflow where appropriate
- local image presentation inside Electron
- safe handling of local file paths
- structured renderer-facing similarity results
- visual validation of the current threshold and grouping behavior
- manual review on larger real photo collections after UI integration
- basic UI responsiveness and usability
- regression validation for Milestones 1 and 2

## Explicitly Out of Scope

The following must **not** be implemented during Milestone 3:

- permanent photo deletion
- Move to Trash / Recycle Bin
- automatic deletion
- automatic keep/delete decisions
- best-photo recommendation
- image-quality scoring
- sharpness scoring
- blur scoring
- exposure scoring
- eye-state detection
- face-quality scoring
- face recognition
- person identification
- cloud photo inference
- cloud image uploads
- semantic image search
- background folder watching
- persistent database storage
- persistent embedding cache unless required by an observed blocker
- large-scale vector indexing
- custom model training
- model fine-tuning
- final packaging/distribution optimization
- full accessibility certification
- final production-scale performance optimization

Those belong to later milestones.

---

# 3. Locked Product Decisions

The following product decisions carry forward into Milestone 3:

- The application remains local-first.
- The current primary similarity model is DINOv2-small.
- The current model artifact is `onnx-community/dinov2-small`.
- Current embeddings are 384-dimensional CLS-token representations.
- Cosine similarity is used for pairwise comparison.
- The current provisional cosine-similarity threshold is `0.90`.
- Grouping uses deterministic greedy strongest-pair-first processing with a complete-link merge condition.
- Singleton photos are excluded from similarity-group output.
- Similarity scores are not probabilities.
- The user remains responsible for final visual judgment.
- No AI-generated keep/delete decision is introduced in this milestone.
- No file is deleted in this milestone.
- The renderer must not receive unrestricted Node filesystem access.
- Personal photo inference remains local.

The current similarity configuration is a validated MVP proof of concept, not a universal production guarantee.

---

# 4. Milestone 3 Product Flow

The intended user flow is:

```text
Launch Similens
      ↓
Select a local photo folder
      ↓
Milestone 1 folder scan
      ↓
Supported photos discovered
      ↓
Run similarity analysis
      ↓
Show analysis progress
      ↓
Milestone 2 similarity engine
      ↓
Candidate SimilarityGroup[]
      ↓
No groups?
  ├── Yes → empty-result state
  └── No  → review screen
                ↓
          inspect groups
                ↓
          select photos
                ↓
          preview photos
                ↓
          visually judge grouping quality
```

No deletion occurs at the end of this flow.

---

# 5. Architecture Boundary

Milestone 3 must preserve the Electron security boundary.

The intended high-level architecture is:

```text
React Renderer
      ↓
typed preload API
      ↓
Electron IPC
      ↓
Main Process
      ↓
photo paths from Milestone 1
      ↓
Milestone 2 similarity services
      ↓
SimilarityGroup[]
      ↓
typed IPC result
      ↓
Renderer review UI
```

The renderer must not directly use:

```text
fs
path
Node filesystem APIs
model runtime APIs
```

Filesystem operations and AI processing remain in the main process.

---

# 6. Production Similarity Integration

Milestone 2 validated the individual similarity components and evaluation workflow.

Milestone 3 must connect them into an application-facing operation.

Conceptually:

```text
photoPaths
    ↓
generate embeddings once per photo
    ↓
generate pairwise cosine similarities
    ↓
groupSimilarPhotos(...)
    ↓
SimilarityGroup[]
```

The production path should reuse the validated Milestone 2 services rather than reimplementing evaluation logic inside React.

Evaluation scripts remain development tools.

Application logic should live in production services.

---

# 7. Renderer-Facing Result Shape

The existing Milestone 2 output is conceptually:

```ts
interface SimilarityGroup {
  id: string
  photos: string[]
}
```

Milestone 3 may introduce a renderer-facing result shape if the UI requires additional non-AI metadata.

For example:

```ts
interface SimilarityReviewPhoto {
  path: string
  displayUrl: string
  fileName: string
}

interface SimilarityReviewGroup {
  id: string
  photos: SimilarityReviewPhoto[]
}
```

This is only an example.

The exact type should be introduced only when the UI requires it.

The original Milestone 2 similarity data should remain independent of React-specific concerns.

---

# 8. Local Photo Presentation

The renderer needs a controlled way to display local images.

The selected implementation must:

- work with Electron
- keep unrestricted filesystem access out of the renderer
- work with supported image paths
- handle spaces and special characters in file paths
- avoid exposing arbitrary filesystem access
- work with the current Content Security Policy
- remain cross-platform

The implementation may use a validated local-photo URL/protocol or another narrow main/preload-controlled mechanism.

The exact mechanism should be selected during implementation after checking Electron behavior and CSP requirements.

Full image data should not be converted to large base64 strings across IPC without a demonstrated need.

---

# 9. Feature Breakdown

Milestone 3 contains seven features.

```text
Milestone 3 — Similar Photo Review UI

Feature 1 — Production Similarity Pipeline Integration
Feature 2 — Analysis State & Progress UI
Feature 3 — Similarity Results Screen
Feature 4 — Group Navigation & Photo Selection
Feature 5 — Photo Preview & Details
Feature 6 — Empty, Error & Recovery States
Feature 7 — Visual Validation & Milestone Completion
```

Each feature should be validated before moving to the next one.

---

# Feature 1 — Production Similarity Pipeline Integration

## Goal

Make the validated Milestone 2 similarity engine callable through the actual Electron application.

## 1.1 Create an Application-Facing Similarity Operation

The production operation should accept discovered photo paths and return structured similarity groups.

Conceptually:

```text
analyzePhotoSimilarity(photoPaths)
```

The operation should:

1. load/reuse the DINOv2 model
2. generate one embedding per photo
3. reuse embeddings for pairwise comparison
4. calculate cosine similarities
5. apply the current threshold
6. generate deterministic groups
7. return structured results

Evaluation-only logging should not leak into the production service.

## 1.2 Reuse Existing Milestone 2 Services

The production pipeline should reuse:

```text
imageDecoder.ts
imageEmbedding.ts
embeddingSimilarity.ts
similarityGrouping.ts
```

A thin orchestration service may be introduced if needed.

Do not duplicate the Milestone 2 algorithms in an IPC handler or React component.

## 1.3 Add Typed IPC

The renderer should request similarity analysis through a narrow typed preload API.

Conceptually:

```text
renderer
→ window.similens.analyzeSimilarPhotos(...)
→ preload
→ IPC
→ main
→ similarity service
```

The exact API naming should follow the current preload conventions.

## 1.4 Define Structured Success / Failure Responses

The IPC boundary should distinguish successful analysis from failure.

A discriminated response type is preferred.

Conceptually:

```ts
type SimilarityAnalysisResponse =
  | {
      ok: true
      groups: SimilarityGroup[]
    }
  | {
      ok: false
      error: string
    }
```

The exact shape may include additional metadata if justified by the UI.

## 1.5 Avoid Unnecessary Repeated Inference

Within one analysis request:

```text
one photo
→ one embedding
```

Pairwise comparisons must reuse generated embeddings.

Persistent cross-session caching is still outside scope unless later evidence justifies it.

## Feature 1 Acceptance Criteria

- [ ] A production similarity orchestration path exists.
- [ ] Existing Milestone 2 services are reused.
- [ ] Renderer does not call model or filesystem APIs directly.
- [ ] Typed preload/IPC integration exists.
- [ ] Similarity analysis returns structured groups.
- [ ] Failure responses are structured.
- [ ] One embedding is generated per photo within an analysis run.
- [ ] Current threshold and grouping behavior remain unchanged unless new evidence justifies a change.
- [ ] Milestone 2 evaluation commands still pass.

---

# Feature 2 — Analysis State & Progress UI

## Goal

Make similarity analysis understandable while it is running.

The user should never wonder whether the application has frozen.

## 2.1 Define Analysis States

The renderer should have clear states such as:

```text
idle
scanning
ready
analyzing
success
empty
error
```

The exact state model should remain simple.

Avoid adding a complex state-management library unless the current React state becomes difficult to manage.

## 2.2 Start Similarity Analysis

After a folder scan succeeds and supported photos are available, the UI should provide a clear action to begin similarity analysis.

Possible wording:

```text
Find Similar Photos
```

The exact text can be refined during UI implementation.

## 2.3 Show Analysis Progress

At minimum, the UI should communicate:

```text
Analyzing photos...
```

If meaningful progress information becomes available from the main process, the UI may show:

```text
17 / 120 photos analyzed
```

or:

```text
Generating photo embeddings...
Comparing photos...
Grouping similar photos...
```

Fake percentage progress should not be introduced.

A simple indeterminate progress state is acceptable if reliable incremental progress is not yet available.

## 2.4 Prevent Duplicate Runs

While an analysis request is already running, the UI should prevent accidental duplicate analysis requests for the same state.

## Feature 2 Acceptance Criteria

- [ ] Analysis has a clear loading state.
- [ ] The user can intentionally start similarity analysis.
- [ ] The UI does not appear frozen during inference.
- [ ] Duplicate analysis actions are prevented while a run is active.
- [ ] No fake numerical progress is shown.
- [ ] Success, empty, and error transitions are clear.

---

# Feature 3 — Similarity Results Screen

## Goal

Present near-duplicate groups visually in a way that is easy to scan and understand.

## 3.1 Results Summary

The result screen should show a concise summary.

Examples:

```text
2 similar-photo groups found
10 photos in groups
28 photos left ungrouped
```

Only show statistics that can be calculated correctly from the current data.

## 3.2 Group Presentation

Each similarity group should be visually separated from other groups.

A group may include:

- group label
- photo count
- thumbnail grid
- group-level selected count if useful

The generated internal group ID does not need to be treated as a persistent user-facing identity.

A human-friendly label such as:

```text
Group 1
Group 2
```

is sufficient for the MVP.

## 3.3 Responsive Thumbnail Grid

The grid should:

- work at different application window sizes
- preserve image aspect ratio where practical
- avoid stretching photos
- keep consistent thumbnail sizing
- make group boundaries visually obvious
- remain usable with groups larger than the current evaluation examples

## 3.4 Local Thumbnail Loading

Photos must be displayed through the selected controlled local-image mechanism.

Broken or unreadable photo presentation should degrade gracefully rather than crash the whole results screen.

## 3.5 Preserve Group Membership

The UI must display the grouping returned by the similarity engine.

React should not independently regroup or reorder photos based on new similarity logic.

UI-only sorting may be introduced later if clearly separated from AI grouping semantics.

## Feature 3 Acceptance Criteria

- [ ] Similarity groups are rendered visually.
- [ ] Each group is clearly separated.
- [ ] Photo count per group is visible or easily understood.
- [ ] Thumbnail grid is responsive.
- [ ] Photos are not visually stretched.
- [ ] Local photos display without giving the renderer unrestricted filesystem access.
- [ ] A broken thumbnail does not crash the whole screen.
- [ ] Renderer preserves engine group membership.

---

# Feature 4 — Group Navigation & Photo Selection

## Goal

Let the user review groups efficiently and mark photos for future actions.

No file deletion occurs yet.

## 4.1 Group Navigation

If multiple groups exist, the user should be able to move through them clearly.

Possible approaches:

- scrollable grouped sections
- next/previous group navigation
- sidebar/list of groups
- compact group index

Start with the simplest approach that remains usable.

## 4.2 Photo Selection

The user should be able to select and deselect individual photos inside a similarity group.

Selection is UI state only.

It does **not** mean:

```text
delete now
```

and it does not trigger filesystem changes.

## 4.3 Selection Visibility

Selected photos must be visually obvious.

Possible signals include:

- checkbox
- selection border
- overlay
- selected counter

The design should avoid ambiguity.

## 4.4 Group-Level Selection Behavior

If a group-level selection control is introduced, its behavior must be explicit.

Do not introduce complex bulk-selection behavior unless it clearly improves the MVP.

## 4.5 No Automatic Selection

Milestone 3 must not automatically select a “worst” photo or recommend which image to remove.

That belongs to later quality-scoring work.

## Feature 4 Acceptance Criteria

- [ ] User can move between or clearly navigate similarity groups.
- [ ] Individual photos can be selected.
- [ ] Individual photos can be deselected.
- [ ] Selection state is visually obvious.
- [ ] Selection does not modify files.
- [ ] No photo is selected automatically based on AI quality judgment.
- [ ] Selection state remains consistent while navigating the current result set.

---

# Feature 5 — Photo Preview & Details

## Goal

Allow closer inspection when thumbnails are not enough to make a visual judgment.

## 5.1 Larger Preview

Selecting or opening a thumbnail should allow a larger image preview.

The preview should make it easy to inspect:

- facial differences
- eye state
- framing
- motion
- background differences
- composition differences
- blur visible to the human eye

No automatic scoring is required.

## 5.2 Close / Return Behavior

The user must be able to leave the preview and return to the same review context without losing selection state.

## 5.3 Basic Photo Details

Useful details may include:

```text
file name
dimensions
file size
format
```

Only expose metadata that can be retrieved safely and reasonably.

Do not build a full EXIF viewer in this milestone.

## 5.4 Cross-Platform Paths

User-facing details should avoid exposing awkward raw path formatting where a cleaner filename is sufficient.

Full path may be shown only where it is genuinely useful.

## Feature 5 Acceptance Criteria

- [ ] A photo can be opened in a larger preview.
- [ ] Preview can be closed without losing review state.
- [ ] Selection state survives preview open/close.
- [ ] Basic useful photo details are available.
- [ ] No unnecessary EXIF system is introduced.
- [ ] Preview works for currently supported formats through the chosen display path.

---

# Feature 6 — Empty, Error & Recovery States

## Goal

Keep the review workflow understandable when there are no groups or when something fails.

## 6.1 No Similar Groups

If analysis returns no candidate groups, show a useful empty state.

Example:

```text
No similar photo groups found.
```

Do not present this as an error.

## 6.2 Analysis Failure

If similarity analysis fails, the UI should:

- stop the loading state
- show a concise error
- avoid exposing an unnecessary raw stack trace to the user
- allow a reasonable recovery action

Possible recovery:

```text
Try Again
```

or:

```text
Choose Another Folder
```

## 6.3 Invalid / Missing Files

Files may disappear or become unreadable after scanning.

The application should handle this without crashing the entire renderer.

The exact recovery behavior can remain simple in the MVP.

## 6.4 Return to Folder Selection

The user should be able to leave the current review result and select another folder without restarting the application.

## Feature 6 Acceptance Criteria

- [ ] No-group result has a dedicated empty state.
- [ ] Empty state is not treated as an application error.
- [ ] Analysis failure produces a clear error state.
- [ ] User can recover from an analysis error.
- [ ] Missing/unreadable local images do not crash the entire renderer.
- [ ] User can return to folder selection and start a new workflow.

---

# Feature 7 — Visual Validation & Milestone Completion

## Goal

Use the new review UI to judge whether the Milestone 2 similarity behavior feels correct to a human reviewer.

This is the first milestone where grouping quality can be reviewed efficiently at visual scale.

## 7.1 Preserve Numerical Regression Tests

Milestone 2 validation remains required.

Relevant commands include:

```bash
npm run evaluate:phash
npm run test:dinov2
npm run evaluate:dinov2
npm run test:grouping
npm run evaluate:grouping
```

The UI must not silently change the validated similarity behavior.

## 7.2 Test Real Photo Collections

After the UI is working, evaluate folders larger and more varied than the original 38-photo labeled dataset.

Suggested progression:

```text
dozens of photos
      ↓
hundreds of photos
      ↓
larger folders where practical
```

A later test may include:

```text
1,000–2,000 photos
```

when the workflow is ready for meaningful scalability evaluation.

No arbitrary size must be forced before the UI is usable.

## 7.3 Human Visual Review

For each generated group, ask:

```text
Do these photos genuinely feel like the same burst, shot, scene, or moment?
```

Look for cases where:

```text
mathematically accepted
but
visually questionable
```

Examples may include:

- same person but different shot
- same room but different composition
- same background but different moment
- same subject with too much movement
- visually similar color/layout but different photo intent

## 7.4 Record Questionable Groups

If visually questionable groups appear, record:

- the photos involved
- their pairwise similarity scores
- the current threshold
- which complete-link condition allowed the group
- whether the problem is model, threshold, grouping strategy, or ground truth

Do not immediately change the algorithm based on one surprising example.

Collect evidence first.

## 7.5 Recalibration Rule

The current `0.90` threshold may be revisited only when new real-world evidence justifies it.

Any threshold change must be:

- measured
- documented
- rerun against the labeled dataset
- checked for new false positives and false negatives
- revalidated at group level

## 7.6 Basic UI Performance

Observe:

- time from analysis start to result display
- renderer responsiveness during analysis
- thumbnail loading behavior
- memory behavior during realistic review
- usability with larger groups

A production-grade benchmark suite is not required yet.

## Feature 7 Acceptance Criteria

- [ ] Milestone 2 regression tests still pass.
- [ ] Similarity groups can be visually reviewed in the application.
- [ ] At least one larger real-world folder has been inspected through the UI.
- [ ] Visually questionable groups, if any, are documented.
- [ ] No threshold/model/grouping change is made without evidence.
- [ ] Renderer remains responsive enough for the MVP workflow.
- [ ] Known UI and similarity limitations are documented.
- [ ] Final lint/type/build validation passes.

---

# 10. Milestone 3 End-to-End Acceptance Test

Use a real local photo folder.

Perform this flow:

1. Launch Similens.
2. Select a local folder.
3. Confirm Milestone 1 scanning still works.
4. Confirm supported photos are discovered.
5. Start similarity analysis.
6. Confirm the application enters an analysis/loading state.
7. Confirm the UI remains understandable while DINOv2 processing runs.
8. Confirm the main process returns structured similarity groups.
9. If groups exist, confirm the results screen appears.
10. Confirm group boundaries are visually clear.
11. Confirm thumbnails render.
12. Confirm photos are not stretched incorrectly.
13. Select a photo.
14. Confirm selection is visually obvious.
15. Deselect the photo.
16. Confirm selection updates correctly.
17. Open a larger photo preview.
18. Confirm the preview is readable and useful for comparison.
19. Close the preview.
20. Confirm review and selection state are preserved.
21. Navigate to another similarity group.
22. Confirm navigation does not alter group membership.
23. Return to folder selection.
24. Run a folder with no expected duplicate group.
25. Confirm the empty-result state.
26. Trigger or simulate an analysis failure where practical.
27. Confirm the UI exits loading state and shows a recoverable error.
28. Confirm no photo was deleted or modified.
29. Confirm no photo was uploaded for remote inference.
30. Run Milestone 2 regression evaluations.
31. Run:

```bash
npm run lint
npm run build
```

If the workflow passes and known limitations are documented, Milestone 3 can be considered functionally complete.

---

# 11. Milestone 3 Definition of Done

Milestone 3 is complete only when **all** required items are satisfied.

## Integration

- [ ] Production similarity orchestration exists.
- [ ] Milestone 2 services are reused.
- [ ] Typed renderer/preload/main IPC exists.
- [ ] Renderer does not receive unrestricted filesystem access.
- [ ] Similarity results reach the renderer in structured form.
- [ ] Errors cross the IPC boundary in a controlled form.

## Analysis Experience

- [ ] User can start similarity analysis.
- [ ] Analysis/loading state is clear.
- [ ] Duplicate analysis requests are prevented.
- [ ] Success, empty, and error transitions are clear.

## Results UI

- [ ] Candidate groups are displayed visually.
- [ ] Group boundaries are clear.
- [ ] Responsive thumbnail layout exists.
- [ ] Supported local images can be displayed safely.
- [ ] Broken image presentation does not crash the whole view.

## Review Interaction

- [ ] Group navigation is usable.
- [ ] Individual photo selection works.
- [ ] Deselection works.
- [ ] Selection state is obvious.
- [ ] Selection does not modify local files.
- [ ] No AI quality-based automatic selection exists.

## Preview

- [ ] Larger photo preview exists.
- [ ] Preview can be closed cleanly.
- [ ] Review state survives preview.
- [ ] Basic useful file details are available.

## Recovery

- [ ] No-group empty state exists.
- [ ] Analysis error state exists.
- [ ] User can recover from errors.
- [ ] User can select another folder without restarting the application.

## Validation

- [ ] Milestone 2 regression tests still pass.
- [ ] At least one larger real-world folder has been visually reviewed.
- [ ] Questionable grouping behavior is documented if observed.
- [ ] Current threshold/grouping decisions remain evidence-based.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] No known crash exists in the main review workflow.

## Scope Discipline

- [ ] No photo deletion is implemented.
- [ ] No automatic keep/delete recommendation is implemented.
- [ ] No image-quality scoring is implemented.
- [ ] No face recognition is introduced.
- [ ] No cloud photo inference is introduced.
- [ ] No unnecessary new AI model is introduced.
- [ ] No premature database/vector-index infrastructure is introduced.

---

# 12. Suggested Implementation Order

Follow this order:

```text
Feature 1
Production Similarity Pipeline Integration
        ↓
Validate IPC + structured result
        ↓
Commit


Feature 2
Analysis State & Progress UI
        ↓
Validate loading/error transitions
        ↓
Commit


Feature 3
Similarity Results Screen
        ↓
Validate local thumbnails + responsive groups
        ↓
Commit


Feature 4
Group Navigation & Selection
        ↓
Validate selection behavior
        ↓
Commit


Feature 5
Photo Preview & Details
        ↓
Validate review state
        ↓
Commit


Feature 6
Empty / Error / Recovery States
        ↓
Validate recovery flow
        ↓
Commit


Feature 7
Visual Validation & Full Milestone Testing
        ↓
Run larger real-world review
        ↓
Run regression suite
        ↓
Final documentation sync
        ↓
Commit


Milestone 3 complete
```

Small, coherent commits are preferred over one large milestone commit.

---

# 13. Suggested Git Commit Checkpoints

Exact wording may change based on implementation.

Examples:

```text
feat: integrate similarity engine with app workflow
feat: add similarity analysis states
feat: add similar-photo results grid
feat: add group navigation and photo selection
feat: add local photo preview
feat: add similarity review recovery states
test: validate milestone 3 review workflow
chore: complete milestone 3 validation
```

Commit when a coherent, stable, testable unit is complete.

---

# 14. Important UI and Engineering Rules

## Keep AI Logic Out of React

React renders state and handles user interaction.

It must not become the place where:

- embeddings are generated
- cosine similarity is calculated
- photo groups are recomputed
- filesystem traversal occurs

Those responsibilities remain outside the renderer.

## Do Not Reimplement the Evaluation Scripts in Production

Evaluation scripts are development tools.

Production application behavior should use reusable services.

## Do Not Invent Progress

If reliable percentage progress is unavailable, show an honest indeterminate loading state.

Do not fake percentages.

## Do Not Treat Group IDs as Persistent Identity

Generated group IDs are result-relative.

For example:

```text
group-1
group-2
```

may change when the group set changes.

UI state should not assume these IDs are permanent across independent analyses.

## Selection Is Not Deletion

A selected photo only represents UI review state in Milestone 3.

No filesystem action occurs.

## Similarity Is Not Quality

A photo may be very similar to another photo while still being:

- sharper
- blurrier
- better framed
- worse framed
- eyes open
- eyes closed

Milestone 3 does not decide which one is better.

## Keep Visual Judgment Human

The purpose of the review UI is partly to expose cases where numerical grouping and human perception disagree.

The UI should make those cases easier to inspect, not hide them.

## Preserve Privacy

- photos remain local
- no photo upload is introduced
- local file access stays behind controlled Electron boundaries
- model download and photo inference remain conceptually separate

## Prefer Simple UI State

Use React state first.

Introduce additional state-management infrastructure only if real complexity justifies it.

## Avoid Premature Optimization

Do not add:

- database layers
- persistent caches
- workers
- batching frameworks
- virtualization libraries
- vector indexes

unless an observed problem requires them.

Measured problems should drive optimization.

---

# 15. Expected Milestone Output

At the end of Milestone 3, the user-facing flow should conceptually look like:

```text
Folder selected
      ↓
38 / 100 / 500+ photos discovered
      ↓
Find Similar Photos
      ↓
Analyzing...
      ↓
2 similar-photo groups found
      ↓

Group 1
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Photo A │ │ Photo B │ │ Photo C │
└─────────┘ └─────────┘ └─────────┘

Group 2
┌─────────┐ ┌─────────┐
│ Photo D │ │ Photo E │
└─────────┘ └─────────┘

      ↓
Select / inspect photos
      ↓
Open larger preview
      ↓
Return to review
```

No selected photo is deleted during this milestone.

---

# 16. Known Risks to Watch During Implementation

Potential Milestone 3 risks include:

- Electron local-image URL/CSP behavior
- HEIC display behavior in the renderer
- large-image memory usage
- renderer freezing if heavy work accidentally runs in the UI process
- overly large IPC payloads
- file-path encoding issues
- missing files after the scan
- duplicate analysis requests
- selection state becoming coupled to unstable result-relative group IDs
- loading every full-resolution image unnecessarily
- UI choices accidentally implying that similarity means “safe to delete”
- visually questionable groups that were not obvious in numerical evaluation

These should be handled when observed, without prematurely expanding architecture.

---

# 17. Milestone 3 Visual Validation Strategy

Milestone 2 established:

```text
Does the algorithm match labeled ground truth?
```

Milestone 3 adds:

```text
Does the result also look correct to a human reviewer?
```

The visual review process should specifically challenge cases such as:

```text
same person
+
same background
+
different pose
```

or:

```text
same scene
+
meaningful camera movement
```

or:

```text
all complete-link pair scores >= 0.90
+
one photo still feels visually out of place
```

If such cases appear, they become evidence for future threshold or grouping refinement.

They should not automatically trigger immediate algorithm changes.

---

# 18. Next Milestone Direction

The milestone after Milestone 3 should be defined only after the review UI has been used on real photo collections.

Likely future areas include:

- safe Move to Trash / Recycle Bin workflow
- confirmation before file actions
- batch removal of selected photos
- undo/recovery strategy where supported
- optional best-photo assistance
- quality scoring
- larger-scale performance improvements
- persistent embedding caching if justified

The exact scope should be defined in a new source-of-truth document after Milestone 3 findings are available.

---

# Final Milestone Statement

Milestone 3 transforms Similens from a validated AI similarity engine into an actual visual review experience.

The milestone should connect:

```text
Milestone 1
Local photo discovery
        ↓

Milestone 2
Local AI similarity engine
        ↓

Milestone 3
Human-readable similarity review UI
```

The key success condition is not merely that groups can be rendered.

The result must be:

```text
technically integrated
+
visually understandable
+
safe to inspect
+
easy to navigate
+
useful for human judgment
```

while preserving the current project boundaries:

```text
local inference
no deletion
no automatic keep/delete decision
no cloud photo upload
```

Milestone 3 is complete when the user can scan a local folder, run the validated similarity engine, visually inspect the resulting groups, select and preview photos without modifying them, recover from normal UI errors, and use the interface to judge whether the current similarity behavior makes sense on real photo collections.
