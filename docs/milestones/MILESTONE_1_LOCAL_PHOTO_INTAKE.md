# Similens — Milestone 1: Local Photo Intake

**Document type:** Source of Truth  
**Project:** Similens  
**Milestone:** 1 — Local Photo Intake  
**Status:** Planned  
**Purpose:** Define the exact scope, implementation tasks, acceptance criteria, and testing requirements for the first functional milestone of Similens.

---

## 1. Milestone Goal

Milestone 1 establishes the complete local-photo intake flow.

By the end of this milestone, a user should be able to:

1. Open Similens.
2. Select a local folder using the operating system's native folder picker.
3. Have Similens scan that folder for supported image files.
4. See that the scan is in progress.
5. See a summary of how many supported photos were found.
6. See which folder was scanned.
7. Cancel folder selection without causing an error.
8. Receive a clear error state if the folder cannot be scanned.

No AI model, similarity detection, clustering, photo grouping, or deletion functionality belongs to this milestone.

---

# 2. Milestone Scope

## Included

- Native folder selection
- Secure renderer-to-main communication through Electron preload APIs
- Folder-path return to the UI
- Local file-system scanning
- Recursive scanning of subfolders
- Supported image filtering
- Basic scan progress/state handling
- Scan result summary
- Basic error handling
- Cross-platform-safe path handling
- Manual functional testing

## Supported Image Formats

For Milestone 1:

- `.jpg`
- `.jpeg`
- `.png`
- `.heic`

Extension matching should be case-insensitive.

Examples:

```text
IMG_001.JPG   → supported
photo.jpeg    → supported
sample.PNG    → supported
image.heic    → supported
notes.txt     → ignored
video.mp4     → ignored
```

## Explicitly Out of Scope

The following must **not** be implemented during Milestone 1:

- AI model loading
- DINOv2
- CLIP
- ONNX inference
- image embeddings
- perceptual hashing
- similarity calculation
- clustering
- duplicate detection
- image-quality scoring
- photo deletion
- Move to Trash / Recycle Bin
- image preview gallery
- photo-group UI
- database or embedding cache
- file watching
- automatic rescanning
- cloud storage integration

These belong to later milestones.

---

# 3. Architecture for Milestone 1

The renderer must not directly access Node.js file-system APIs.

The intended flow is:

```text
React Renderer
      ↓
Typed preload API
      ↓
Electron IPC
      ↓
Main Process
      ↓
Native Folder Dialog / Node.js File System
      ↓
Result returned through IPC
      ↓
React Renderer
```

This boundary should be preserved throughout the milestone.

---

# 4. Feature Breakdown

Milestone 1 contains four features.

```text
Milestone 1 — Local Photo Intake

Feature 1 — Native Folder Selection
Feature 2 — Photo Discovery & Folder Scanning
Feature 3 — Scan State & Result Summary
Feature 4 — Error Handling & Milestone Validation
```

Each feature should be completed and validated before moving to the next one.

---

# Feature 1 — Native Folder Selection

## Goal

Allow the user to select a local folder through the operating system's native folder picker.

The renderer should receive the selected folder path through a controlled preload API.

## Subtasks

### 1.1 Create the initial folder-selection UI

Add the minimal UI required for this feature:

- Similens title
- short subtitle
- `Select Folder` button
- area for displaying the selected folder path

No photo grid or advanced design is needed yet.

### 1.2 Define the renderer-facing preload API

Expose a typed Similens-specific API from the preload layer.

Target concept:

```text
window.similens.selectFolder()
```

The renderer must not receive a generic unrestricted IPC interface.

### 1.3 Add TypeScript declarations

Create the necessary global TypeScript declaration so the renderer understands:

```text
window.similens
```

The API should have a clear return type.

Conceptually:

```text
selected folder path
or
no folder when the user cancels
```

### 1.4 Create the main-process IPC handler

Create a dedicated IPC handler for folder selection.

It should:

1. receive the request,
2. open Electron's native folder dialog,
3. allow directory selection only,
4. return the selected path,
5. safely handle cancellation.

### 1.5 Connect renderer → preload → main

Wire the `Select Folder` button to the preload API.

Expected flow:

```text
User clicks Select Folder
        ↓
Renderer calls window.similens.selectFolder()
        ↓
Preload invokes IPC
        ↓
Main process opens native dialog
        ↓
User chooses folder
        ↓
Folder path returns to renderer
```

### 1.6 Display the selected folder

After a successful selection, show the folder path in the UI.

The UI must update only after a valid folder has been selected.

### 1.7 Handle user cancellation

If the user opens the folder picker and clicks Cancel:

- no error should appear,
- the application should remain usable,
- the previous valid folder selection should not be replaced by invalid data.

## Feature 1 Acceptance Criteria

Feature 1 is complete only when all of these are true:

- [x] `Select Folder` opens the native operating-system folder picker.
- [x] Only folders can be selected.
- [x] Selecting a folder returns its path to React.
- [x] The selected folder path is visible in the UI.
- [x] Canceling the picker causes no error.
- [x] The renderer does not directly import Node.js `fs`, `path`, or Electron main-process APIs.
- [x] Folder selection goes through the preload bridge.
- [x] The preload API is TypeScript-typed.
- [x] The application still passes the normal project build/type checks.

## Feature 1 Manual Tests

### Test F1.1 — Successful selection
**Status:** Passed

1. Launch Similens.
2. Click `Select Folder`.
3. Choose a normal local folder.
4. Confirm.

Expected:

- dialog closes,
- selected path appears,
- no console/runtime error occurs.

### Test F1.2 — Cancel
**Status:** Passed

1. Click `Select Folder`.
2. Click Cancel.

Expected:

- app remains stable,
- no error message,
- no invalid path is displayed.

### Test F1.3 — Select another folder
**Status:** Passed

1. Select Folder A.
2. Select Folder B.

Expected:

- displayed path updates to Folder B.

---

# Feature 2 — Photo Discovery & Folder Scanning

## Goal

Scan the selected folder and discover supported image files.

The scan should include nested subfolders.

## Subtasks

### 2.1 Define the scan result data shape

Before implementing scanning, define a TypeScript type/interface representing the scan result.

It should contain at least:

- selected root folder
- total supported photo count
- discovered photo paths

Optional metadata can be added later only if required.

Avoid collecting unnecessary image data during this milestone.

### 2.2 Create a photo-scanning service in the main process

Keep file-discovery logic separate from IPC handler code.

Suggested responsibility:

```text
scanPhotoFolder(folderPath)
```

The service should return supported image paths.

### 2.3 Implement recursive directory traversal

Scan:

```text
Selected folder
├── photo1.jpg
├── photo2.png
├── Trip/
│   ├── photo3.jpeg
│   └── Day-2/
│       └── photo4.heic
└── notes.txt
```

Expected discovered photos:

```text
photo1.jpg
photo2.png
Trip/photo3.jpeg
Trip/Day-2/photo4.heic
```

`notes.txt` should be ignored.

### 2.4 Add supported-extension filtering

Only include:

```text
.jpg
.jpeg
.png
.heic
```

Matching must be case-insensitive.

Do not identify file type from filename text alone beyond extension filtering in this milestone.

Deeper file validation can be introduced later if needed.

### 2.5 Create the scan IPC API

Expose a feature-specific API conceptually similar to:

```text
window.similens.scanFolder(folderPath)
```

The renderer should request scanning through preload.

### 2.6 Return scan results to the renderer

The renderer should receive structured data rather than raw internal Node.js objects.

Example conceptual result:

```text
folderPath
photoCount
photos[]
```

### 2.7 Avoid scanning before a valid folder exists

The scan operation should require a valid selected folder.

The UI should not start scanning when no folder has been selected.

## Feature 2 Acceptance Criteria

- [x] A selected folder can be scanned.
- [x] `.jpg`, `.jpeg`, `.png`, and `.heic` files are detected.
- [x] Uppercase variants such as `.JPG` and `.PNG` are detected.
- [x] Unsupported files are ignored.
- [x] Nested folders are scanned recursively.
- [x] The result contains the correct number of supported photos.
- [x] The result contains the discovered photo paths.
- [x] Scanning occurs outside the React renderer.
- [x] The renderer does not directly access Node.js `fs`.
- [x] File-scanning logic is separated from UI logic.
- [x] Project typecheck/build still passes.

## Feature 2 Manual Tests

Create a small temporary test folder such as:

```text
similens-test/
├── image-1.jpg
├── image-2.PNG
├── document.pdf
├── video.mp4
└── nested/
    ├── image-3.jpeg
    ├── image-4.heic
    └── notes.txt
```

Expected result:

```text
Supported photos found: 4
```

### Test F2.1 — Mixed file types
**Status:** Passed

Expected:

- four images found,
- PDF, MP4, and TXT ignored.

### Test F2.2 — Nested folder
**Status:** Passed

Expected:

- images inside `nested/` are included.

### Test F2.3 — Empty folder
**Status:** Passed

Expected:

```text
0 photos found
```

No error should occur.

### Test F2.4 — Uppercase extension
**Status:** Passed

Expected:

`image-2.PNG` is detected.

---

# Feature 3 — Scan State & Result Summary

## Goal

Make the local-photo intake flow understandable to the user.

The UI should clearly communicate:

- what folder is selected,
- whether scanning is happening,
- whether scanning finished,
- how many supported photos were found.

## Subtasks

### 3.1 Define scan UI states

At minimum, support:

```text
idle
folder-selected
scanning
success
error
```

These can be represented however the implementation naturally requires.

### 3.2 Add a scan action

After selecting a folder, provide a clear action such as:

```text
Scan Photos
```

Folder selection and scanning should remain separate actions during Milestone 1.

Reason:

This makes state, testing, and error behavior easier to understand.

Automatic scanning may be reconsidered later.

### 3.3 Disable invalid actions

Examples:

- Scan button should not be active before a folder exists.
- Repeated clicks should not accidentally start multiple concurrent scans.

### 3.4 Display scanning state

While scanning:

- show that the application is working,
- prevent duplicate scan requests,
- avoid displaying stale success information as current.

A simple loading label/spinner is enough.

Detailed percentage progress is **not required** in Milestone 1.

### 3.5 Display scan summary

After successful scanning, show at least:

```text
Selected folder: /path/to/folder
Photos found: 1842
```

Exact visual design is not important yet.

### 3.6 Handle zero-photo result

A folder containing no supported images is a valid successful scan.

Example:

```text
No supported photos found in this folder.
```

This is not an error state.

### 3.7 Handle rescanning

The user should be able to:

1. scan Folder A,
2. select Folder B,
3. scan again,
4. receive Folder B's result.

Old result state must not be confused with the new folder.

## Feature 3 Acceptance Criteria

- [x] Folder selection and scan initiation are clearly separated.
- [x] Scan cannot start without a selected folder.
- [x] UI visibly enters a scanning state.
- [x] Duplicate scan requests are prevented while a scan is running.
- [x] Successful scan displays selected folder.
- [x] Successful scan displays photo count.
- [x] Zero-photo folders display a valid empty result, not an error.
- [x] Selecting a new folder does not leave misleading old results.
- [x] Rescanning works.
- [x] App remains responsive during normal small/medium test scans.

## Feature 3 Manual Tests

### Test F3.1 — Initial state
**Status:** Passed

Expected:

- no fake scan result,
- scan action unavailable until folder selection.

### Test F3.2 — Normal scan
**Status:** Passed

Expected:

```text
Scanning...
```

followed by:

```text
Photos found: N
```

### Test F3.3 — Empty folder
**Status:** Passed

Expected:

clear zero-photo message.

### Test F3.4 — Folder change
**Status:** Passed

Scan Folder A, then choose Folder B.

Expected:

Folder A result is cleared or clearly replaced before Folder B result is presented.

### Test F3.5 — Repeated scan click
**Status:** Passed

Try clicking Scan repeatedly.

Expected:

only one active scan operation.

---

# Feature 4 — Error Handling & Milestone Validation

## Goal

Make the photo-intake flow resilient enough to serve as the foundation for the AI milestone.

## Subtasks

### 4.1 Handle inaccessible or invalid folder paths

Scanning may fail because:

- folder was deleted after selection,
- permission is denied,
- filesystem access fails,
- path becomes unavailable.

The main process should return a controlled error rather than crashing.

### 4.2 Return safe errors through IPC

Do not expose unnecessary internal stack traces to the renderer UI.

Log enough information for development/debugging while displaying a simple user-facing message.

### 4.3 Add user-facing error state

Example:

```text
Unable to scan this folder.
Please choose another folder and try again.
```

Exact wording can change.

### 4.4 Ensure recovery after an error

After a failed scan, the user should still be able to:

- select another folder,
- scan again,
- receive a successful result.

Restarting the app should not be required.

### 4.5 Run full milestone validation

Run:

```bash
npm run build
```

and any relevant lint/typecheck commands available in the project.

Also perform the full manual acceptance test list in this document.

### 4.6 Review architecture boundaries

Before declaring Milestone 1 complete, confirm:

- React renderer contains UI/state logic.
- Preload exposes only specific safe APIs.
- Main process handles Electron/native operations.
- File-system scanning is outside the renderer.
- No AI logic has been introduced early.

## Feature 4 Acceptance Criteria

- [x] Scan failures do not crash the application.
- [x] User receives a readable error state.
- [x] App can recover from an error without restart.
- [x] No unrestricted Node.js access is exposed to the renderer.
- [x] No generic unrestricted IPC bridge is exposed.
- [x] Build/type validation passes.
- [x] Full Milestone 1 manual test suite passes.

---

# 5. Milestone 1 End-to-End Acceptance Test

Use a test directory containing a mixture of supported images, unsupported files, and nested directories.

Example:

```text
milestone-1-test/
├── IMG_001.jpg
├── IMG_002.JPG
├── screenshot.png
├── notes.txt
├── movie.mp4
├── Trip/
│   ├── IMG_003.jpeg
│   ├── IMG_004.heic
│   └── Day2/
│       └── IMG_005.PNG
└── EmptyFolder/
```

Expected supported image count:

```text
5
```

Perform this exact flow:

1. Launch Similens.
2. Confirm no folder is initially selected.
3. Confirm scanning cannot start yet.
4. Click `Select Folder`.
5. Cancel the picker.
6. Confirm the app remains stable.
7. Select `milestone-1-test`.
8. Confirm the selected folder is shown.
9. Start the scan.
10. Confirm scanning state is visible.
11. Wait for completion.
12. Confirm exactly 5 supported photos are reported.
13. Confirm nested images were discovered.
14. Confirm `.txt` and `.mp4` were ignored.
15. Select an empty folder.
16. Scan it.
17. Confirm the result is 0 photos, not an error.
18. Select another valid photo folder.
19. Confirm rescanning works.
20. Trigger or simulate an invalid/inaccessible folder case.
21. Confirm a controlled error is shown.
22. Confirm a valid scan can still be performed afterward.
23. Run the production build/type validation.

If all tests pass, Milestone 1 can be considered functionally complete.

---

# 6. Milestone 1 Definition of Done

Milestone 1 is complete only when **all** of the following are true:

## Functionality

- [x] User can select a local folder.
- [x] Folder path is displayed.
- [x] User can start a photo scan.
- [x] Scan includes nested directories.
- [x] JPG/JPEG/PNG/HEIC files are discovered.
- [x] Unsupported file types are ignored.
- [x] Result displays the correct photo count.
- [x] Empty folders are handled correctly.
- [x] Folder selection can be changed.
- [x] Folder can be rescanned.
- [x] Cancellation is handled safely.
- [x] Scan errors are handled safely.

## Architecture

- [x] Renderer does not directly use Node.js filesystem APIs.
- [x] Renderer communicates through a typed preload API.
- [x] IPC endpoints are feature-specific.
- [x] Native dialog logic stays in the Electron main process.
- [x] File scanning stays outside the renderer.
- [x] File-scanning logic is reasonably separated from IPC wiring.

## Quality

- [x] TypeScript checks pass.
- [x] Production build passes.
- [x] No known runtime errors during milestone test flow.
- [x] No accidental debug/demo code remains.
- [x] Manual milestone test suite passes.

## Scope Discipline

- [x] No AI model has been integrated.
- [x] No similarity logic has been implemented.
- [x] No photo deletion has been implemented.
- [x] No unnecessary future functionality has been added.

---

# 7. Suggested Implementation Order

Follow this order:

```text
Feature 1
Native Folder Selection
        ↓
Feature 1 validation
        ↓
Commit

Feature 2
Photo Discovery & Folder Scanning
        ↓
Feature 2 validation
        ↓
Commit

Feature 3
Scan State & Result Summary
        ↓
Feature 3 validation
        ↓
Commit

Feature 4
Error Handling & Full Validation
        ↓
Milestone acceptance test
        ↓
Commit
        ↓
Milestone 1 complete
```

---

# 8. Suggested Git Commit Checkpoints

The exact wording can change, but the intended history is:

```text
feat: add native folder selection
feat: discover supported photos in selected folder
feat: add photo scan states and summary
feat: handle photo scan errors
```

If a feature requires multiple meaningful commits, split it naturally rather than forcing everything into one commit.

---

# 9. Decisions Locked for Milestone 1

Unless a real technical problem requires reconsideration, these decisions should remain stable during the milestone:

- Desktop framework: Electron
- Renderer: React + TypeScript
- Native/file operations: Electron main process + Node.js
- Renderer/native boundary: typed preload API
- Folder scan: recursive
- Supported formats: JPG, JPEG, PNG, HEIC
- Folder selection and scanning: separate user actions
- AI functionality: excluded
- Deletion functionality: excluded
- Database/cache: excluded
- Cloud APIs: excluded

If any locked decision changes, update this document before continuing implementation.

---

# 10. Next Milestone

After Milestone 1 is complete, the next milestone is:

## Milestone 2 — AI Similarity Engine

Expected areas:

- create a labeled test photo set,
- establish a simple baseline,
- integrate local pretrained image feature extraction,
- evaluate candidate models,
- generate embeddings,
- calculate image similarity,
- calibrate thresholds,
- group near-duplicate photos.

The exact Milestone 2 scope should be defined in a separate source-of-truth document before implementation begins.

---

# Final Milestone Statement

Milestone 1 is not about AI.

Its job is to create a reliable bridge between:

```text
User's local photo folders
            ↓
         Similens
            ↓
Structured list of supported local photos
```

Once that foundation is reliable, the AI similarity engine can be built on top of it without mixing file-system problems with model-development problems.
