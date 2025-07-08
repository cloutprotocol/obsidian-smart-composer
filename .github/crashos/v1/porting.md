# PRD: Porting Core File System and Editor Interactions

## 1. Objective

This document outlines the next phase of work for the web-based editor proof-of-concept (POC). The primary goal is to implement the necessary Obsidian API mocks to enable core plugin functionalities, specifically file and folder searching, linking, and basic editor interactions. This phase will address the critical `app.vault.getAllFolders is not a function` error and lay the groundwork for a fully integrated user experience.

## 2. Current State & Problem

We have successfully loaded the Smart Composer plugin into the web POC, and the basic chat view renders correctly. However, key interactive features are failing. When a user types `@` in the chat input to mention a file, the application crashes.

The root cause is a `TypeError: app.vault.getAllFolders is not a function`, triggered by the `fuzzySearch` utility. This indicates that our mock `Vault` API in `web-poc/src/lib/obsidian-api.ts` is missing essential methods required for navigating and querying the file system structure. Without these functions, the plugin cannot populate its mention suggestions, breaking a core piece of its functionality.

## 3. Analysis of Next Steps

To resolve the current crash and build a foundation for deeper integration, we must expand our mock API to include support for a hierarchical file system (folders) and provide the methods that plugins expect for file discovery and editor manipulation.

The most direct path forward involves two parallel streams of work:
1.  **Enhancing the `Vault` API**: The current vault simulation is a flat map of files. We must introduce the concept of folders to accurately replicate Obsidian's environment. This will enable us to implement `getAllFolders()` and other file system-aware methods.
2.  **Expanding the `Workspace` and `Editor` APIs**: Beyond just file listings, plugins need to know about the current application context, such as the active file or editor selection. Implementing basic versions of these APIs is crucial for commands that bridge the plugin's UI with the main editor content.

By tackling these API gaps, we not only fix the immediate bug but also unblock a wide range of other plugin features, moving us closer to our strategic goal of seamless plugin portability.

## 4. Implementation Plan

### Phase 1: Mock API Enhancement for Vault Hierarchy

1.  **Introduce Folder Support in Vault**:
    *   **Task**: Update the `Vault`'s internal data structure in `obsidian-api.ts` to support a nested hierarchy of files and folders. The current `Map` should be evolved to represent a tree structure.
    *   **Rationale**: This is the foundational change required to accurately mock a file system and implement folder-related APIs.

2.  **Implement `vault.getAllFolders()`**:
    *   **Task**: Add the missing `getAllFolders()` method to the `Vault` class. This method should traverse the new hierarchical data structure and return an array of mock `TFolder` objects.
    *   **Rationale**: Directly fixes the crash and enables folder-based search features.

3.  **Implement `vault.getFiles()`**:
    *   **Task**: Ensure the existing `getFiles()` method correctly returns a flat array of all `TFile` objects from the hierarchical store, excluding folders.
    *   **Rationale**: This is a core dependency for `fuzzySearch` and many other plugin features that operate on files.

4.  **Enhance `TFile` and `TFolder` Mocks**:
    *   **Task**: The mock `TFile` and `TFolder` objects returned by the API must contain `path` and `name` properties. `TFile` objects must also include a `stat: { mtime: number }` property to support recency-based scoring in search results.
    *   **Rationale**: Provides the necessary metadata for search algorithms and other file-handling logic to function correctly.

### Phase 2: Workspace and Editor API Parity

1.  **Implement `workspace.getActiveFile()`**:
    *   **Task**: Implement a method on the `Workspace` class that returns the `TFile` object corresponding to the currently open and focused file in the editor.
    *   **Rationale**: Crucial for context-aware features, such as finding files relative to the current one.

2.  **Stub `Editor` and `MarkdownView` Classes**:
    *   **Task**: Create basic mock implementations for the `Editor` and `MarkdownView` classes. These mocks should include methods like `getSelection()` or `getLine()` to support commands that interact with editor text.
    *   **Rationale**: Unblocks the implementation of `editorCallback` commands, a common pattern in Obsidian plugins for manipulating text (e.g., "Add selection to chat").

### Phase 3: End-to-End Feature Validation

1.  **Test `@` Mentioning**:
    *   **Task**: Perform a full end-to-end test of the mention feature. Verify that typing `@` triggers the `fuzzySearch`, the UI displays a list of files and folders from the mock vault, and selecting an item inserts a correctly formatted markdown link into the editor.
    *   **Rationale**: Validates the successful integration of the Phase 1 and 2 API enhancements and confirms the fix for the original bug.

2.  **Test Editor Interaction Command**:
    *   **Task**: Implement and test a command that uses an `editorCallback`, such as "Add selection to chat." Verify that the command can read the selected text from the editor component via the mock API.
    *   **Rationale**: Proves that the `Editor` and `MarkdownView` mocks are sufficient for enabling core plugin-to-editor communication.
