# PRD: High-Fidelity File Explorer with Folder Management

## 1. Objective

To replace the current rudimentary file list in the web POC with a high-fidelity, interactive file explorer that mirrors the core functionality of a modern IDE or the Obsidian vault. The current implementation is a flat list that does not represent folder hierarchies, lacks file/folder creation controls, and is aesthetically misaligned with our "crashOS" branding. This limits the application's usability for any project with a nested directory structure and detracts from the desired user experience.

### Referenced Components:

*   **Primary UI:** `web-poc/src/App.tsx`, `web-poc/src/components/FileTreeView.tsx`
*   **Core Logic:** `web-poc/src/lib/obsidian-api.ts` (specifically `Vault.createFolder()`)

## 2. Goal

The goal is to refactor the entire "Vault" sidebar into a fully-featured "crashOS" file explorer. This involves three key enhancements:
1.  **Branding:** Update the sidebar title from "Vault" to "crashOS".
2.  **Hierarchical View:** Implement a nested tree structure that accurately displays folders and files, allowing users to expand and collapse directories.
3.  **Enhanced Controls:** Replace the "Add File" text button with dedicated icons for both adding new files and creating new folders within the selected directory context.

## 3. Implementation Plan

This refactor will be executed in phases to ensure a smooth transition.

### Phase 1: Rebrand and Restructure the Sidebar

1.  **Update Title:**
    *   **Action:** In `web-poc/src/App.tsx`, locate the `h2` or equivalent element rendering "Vault" and change it to "crashOS".

2.  **Integrate a Tree View Component:**
    *   **Action:** We will use a suitable React tree view library to handle the complexities of rendering a hierarchical structure. This will involve installing a new dependency in the `web-poc` directory.
    *   **Action:** Refactor `web-poc/src/components/FileTreeView.tsx`.
        *   Replace the current flat list rendering logic.
        *   Implement logic to recursively build a tree data structure from `app.vault.getAllFolders()` and `app.vault.getFiles()`. This data structure must be compatible with the chosen tree view library.
        *   Render the tree view component, passing it the hierarchical data.

### Phase 2: Implement File and Folder Creation

1.  **Add Action Icons:**
    *   **Action:** In the file explorer's header, replace the "Add File" button with two icon buttons: one for "Add File" and one for "Add Folder". We will use an icon library like `react-icons` to ensure visual consistency.

2.  **Implement "Add Folder" Logic:**
    *   **Action:** Create a new handler function, `handleAddFolder`.
    *   When the "Add Folder" icon is clicked, it should prompt the user for a folder name.
    *   It will then call `app.vault.createFolder('path/to/new/folder')`.
    *   The `FileTreeView` component must then refresh its data source and re-render to show the new folder, likely by listening to the `vault.on('create', ...)` event.

3.  **Refine "Add File" Logic:**
    *   **Action:** Adapt the existing "Add File" logic to be triggered by the new icon.
    *   The creation logic should be context-aware, creating the file within the currently selected folder in the tree view, or at the root if no folder is selected.

### Phase 3: Add Sorting and Interactivity

1.  **Implement Sorting:**
    *   **Action:** Add controls to sort the file tree alphabetically, ensuring that folders are always displayed before files within any given directory. The sorting logic will be applied to the data before it is passed to the tree component.

2.  **Improve Selection and Focus:**
    *   **Action:** Ensure that clicking a file or folder in the tree correctly highlights it as the "selected" item. This state is critical for contextual actions like "Add File/Folder".
    *   Creating a new file or folder should automatically select and focus it, ideally placing it in a "rename" state.

## 4. Success Metrics

- **Branding:** The sidebar header correctly displays "crashOS".
- **Hierarchy:** The file explorer correctly renders nested folders and files, and folders can be expanded/collapsed.
- **Controls:** "Add File" and "Add Folder" actions are initiated from icon buttons.
- **Functionality:**
    - Clicking the "Add Folder" icon successfully creates a new folder in the tree.
    - Clicking the "Add File" icon successfully creates a new file in the tree.
- **Usability:** The tree can be sorted, and items are clearly highlighted on selection.
- **No Regressions:** Existing functionality, such as opening a file by clicking it, remains fully operational.
