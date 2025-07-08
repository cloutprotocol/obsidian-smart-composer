# PRD: High-Fidelity Text Editor and Workspace Port

## 1. Objective

To evolve the web POC's text editor from a simple file display into a high-fidelity replica of the Obsidian workspace and editor environment. The primary goal is to create a robust foundation that accurately mimics Obsidian's state management for active files, views, and leaves. This is essential for supporting advanced plugin functionalities like file editing, link navigation, and context-aware commands, which are currently failing due to a fragile connection between the UI state and the mock API.

### Referenced Components:

*   **Core Logic:** `web-poc/src/lib/obsidian-api.ts` (specifically the `Workspace` and `App` classes)
*   **Primary UI:** `web-poc/src/App.tsx`, `web-poc/src/components/MarkdownEditor.tsx`, `web-poc/src/components/FileTreeView.tsx`

## 2. Analysis of the Problem

The root cause of our persistent "No file is currently open" errors is a mismatch in state management paradigms. Our React UI (`App.tsx`) manages the "active file" as a simple string in its state. The core plugin logic, however, expects to query the application state via `app.workspace.getActiveFile()`, which in the real Obsidian returns a `TFile` object derived from the currently active `WorkspaceLeaf`.

Our current mock `Workspace` does not maintain a reliable `activeLeaf`. We have attempted to patch this by setting `workspace.activeFile` during `openLinkText`, but this is insufficient. Actions initiated from the UI (like clicking the "Apply" button) execute in a context where the `Workspace`'s state is out of sync with the UI's, causing `getActiveFile()` to return `null`. We cannot continue to patch this; we must re-architect.

## 3. Recommendation

We must refactor the mock `Workspace` to be **leaf-centric**, making the `activeLeaf` the single source of truth for the application's context, just as it is in Obsidian. The concept of the "active file" will no longer be a standalone property but will be derived directly from the file associated with the active leaf's view (`activeLeaf.view.file`).

This approach involves creating a more stateful and realistic simulation of the Obsidian workspace. It will be more complex initially but will provide the stable, predictable environment required for the Smart Composer plugin—and any other complex plugin—to run correctly.

## 4. Next Steps: A Phased Implementation

### Phase 1: Solidify the Workspace State

1.  **Refactor `getActiveFile()`:**
    *   **Action:** Modify the `getActiveFile()` method in `web-poc/src/lib/obsidian-api.ts`. It should no longer return `this.activeFile`. Instead, it should return `this.activeLeaf?.view?.file` if the view is a `MarkdownView`. This makes the active leaf the definitive source of truth.

2.  **Refactor `openLinkText()`:**
    *   **Action:** When `openLinkText` is called, it must do more than emit an event. It needs to:
        1.  Find the `TFile` object for the given path.
        2.  Get the main editor leaf using `getEditorLeaf()`.
        3.  Ensure the leaf's view is a `MarkdownView`.
        4.  **Crucially, assign the `TFile` object to `editorLeaf.view.file`.**
        5.  Set `this.activeLeaf = editorLeaf`.
        6.  Emit the `file-open` event for the React UI to consume.

### Phase 2: Enhance the UI to Match Obsidian's UX

3.  **Implement a True Folder Tree:**
    *   **Problem:** The current `FileTreeView` is a simple list. Obsidian has a nested folder structure.
    *   **Action:** Replace the basic `map` over file keys with a proper folder tree component. We can evaluate a library like `react-folder-tree` or build a custom recursive component that can render the nested structure derived from our `app.vault.getAllFolders()` and `app.vault.getFiles()` methods. This is critical for visual fidelity and for testing file operations in nested directories.

4.  **Introduce Tabbed Editing:**
    *   **Problem:** Our editor can only show one file at a time. Obsidian uses tabs.
    *   **Action:** Implement a tabbed interface in the main editor area (`web-poc/src/App.tsx`).
        *   Maintain a list of open files (leaves) in the React state.
        *   Render a tab for each open file.
        *   Clicking a tab should switch the `activeLeaf` in the mock workspace, which will, in turn, update the editor's content via our new state flow.
        *   This provides a robust visual and state-based mechanism for managing multiple open files.

### Phase 3: Validation

5.  **End-to-End Test Plan:**
    *   With the new architecture, repeat the original test case:
        1.  Click a file in the new folder tree. Verify it opens in a new tab and its content is displayed.
        2.  Ask the LLM to edit the file.
        3.  Click the "Apply" button on the generated diff.
        4.  **Expected Result:** The `applyDiff` logic will call `app.workspace.getActiveFile()`. This will now correctly return the `TFile` from the active editor tab's leaf, the diff will be applied, the `FileSystemState` in `App.tsx` will update, and the editor content will refresh. The "No file is currently open" error will be permanently resolved.
