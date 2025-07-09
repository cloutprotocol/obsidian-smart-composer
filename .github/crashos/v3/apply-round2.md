
# PRD: High-Fidelity "Apply" Feature

**Author**: Gemini
**Date**: 2024-07-31
**Status**: In Progress

## 1. Overview

This document outlines the investigation and plan to improve the "Apply" feature in the Smart Composer web proof-of-concept (POC).

### Goal
Achieve a high-fidelity "Apply" feature that mirrors Obsidian's native behavior, providing a seamless and intuitive user experience.

### Current State
The feature is functional but suffers from two key issues:
1.  **Poor User Experience**: When applying a change, a new tab is created to show the diff view. After accepting or rejecting, the focus shifts to the rightmost tab, not the original file tab, disorienting the user.
2.  **TypeScript Error**: A blocking type error (`Type 'TFile' is missing... basename, vault`) exists due to an incomplete mock of the Obsidian API.

### Desired State
The "Apply" action should replace the current file view with a diff view within the **same tab**. Upon completion, the view should revert to the editor for the modified file. The TypeScript error must be resolved.

## 2. The "Apply" Flow: A Deep Dive

The end-to-end flow from user request to file modification has been analyzed:

1.  **Trigger**: The user clicks the "Apply" button on a code block in the chat view. This is handled by `handleApply` in `src/components/chat-view/Chat.tsx`.
2.  **LLM Invocation**: `handleApply` triggers `applyChangesMutation`, which calls the `applyChangesToFile` utility. This utility constructs a detailed prompt for the LLM.
3.  **Internal Prompt Analysis**:
    -   **System Prompt (`src/utils/chat/apply.ts`)**: The core instruction is to rewrite an entire markdown file based on a specific change block, ignoring other suggestions.
    -   **User Prompt (`generateApplyPrompt` in `src/utils/chat/apply.ts`)**: This dynamically assembles the final prompt, including the target file's content, conversation history, and the specific markdown block with the proposed changes.
4.  **Receiving Output**: The LLM returns the entire modified file content. `extractApplyResponseContent` cleans up the response.
5.  **Displaying the Diff**: The `onSuccess` callback in `applyChangesMutation` currently:
    -   Creates a diff patch.
    -   Creates a **new leaf** via `app.workspace.getLeaf(true)`.
    -   Sets the new leaf's view state to `APPLY_VIEW_TYPE`.
6.  **User Interaction & Completion**: In `ApplyViewRoot.tsx`, clicking "Accept" or "Cancel" calls `close()`, which is currently bound to a function that detaches the newly created leaf.

## 3. Investigation: Bugs and Discrepancies

### A. The Tab Navigation Bug

-   **Root Cause 1: New Leaf Creation**: The core issue is `app.workspace.getLeaf(true)`. In our web POC, this incorrectly creates a new tab. The desired behavior is to change the *view* within the *existing* leaf.
-   **Root Cause 2: Flawed `detachLeaf` Logic**: The `detachLeaf` method in `web-poc/src/lib/obsidian-api.ts` naively resets the active leaf to `this.leaves[0]`, the first one in the list (visually the rightmost), instead of the *previously* active leaf.

### B. The `TFile` TypeScript Error

-   **Root Cause 3: Incomplete Mock**: The error `Type 'TFile' is missing the following properties from type 'TFile': basename, vault` is a direct result of our mock `TFile` in `web-poc/src/lib/obsidian-api.ts` being an incomplete representation of the real Obsidian `TFile` class. The core plugin's code relies on these properties.

## 4. Recommendations & Implementation Plan

### 1. Implement View Swapping (Fix for Tab Bug)

-   **Action**: In `src/components/chat-view/Chat.tsx`, modify `applyChangesMutation` to use the **current active leaf** (`app.workspace.activeLeaf`) instead of creating a new one.
-   **Action**: In `web-poc/src/App.tsx`, introduce a new handler, `handleCloseApplyView`, which will be passed to `ApplyViewRoot`.
-   **Logic for `handleCloseApplyView`**: This function will revert the active leaf's view state back to `'markdown'`, effectively showing the editor again for the same file without closing the tab.

### 2. Improve `TFile` Mock Fidelity (Fix for TypeScript Error)

-   **Action**: Update the `TFile` and `TAbstractFile` classes in `web-poc/src/lib/obsidian-api.ts`.
-   **Details**:
    -   Add `vault: Vault;` property to `TAbstractFile` and its constructor.
    -   Add `basename: string;` property to `TFile` and set it in its constructor.

### 3. (Future Enhancement) Improve Leaf History Management

-   **Recommendation**: Implement a simple stack in the `Workspace` class to track the history of active leaves. `setActiveLeaf` would push to the stack, and `detachLeaf` would pop from it, making tab management more robust across the app. This is a lower priority than the immediate fixes.

## 5. Success Metrics

-   The `TFile` TypeScript error is eliminated.
-   The "Apply" action replaces the editor with a diff view in the same tab.
-   After completion, the tab reverts to the editor view for the correct file.
-   No new tabs are created during the "Apply" process.
-   The application's UX feels more like a native desktop app.

//////

Analysis of Potential Root Causes
The PRD correctly identifies the primary issues. Here's a deeper analysis of the potential root causes for the problems with the "Apply" feature, particularly concerning tab management:
Incorrect Leaf Creation Strategy: The fundamental issue is using app.workspace.getLeaf(true) in the web POC. In native Obsidian, this might intelligently find a new pane or tab, but in our simplified web mock, it's hardcoded to always create a new tab. The correct approach for this feature is to replace the view within the current leaf, not open a new one.
Stateless Leaf Detachment: The detachLeaf method in the mock API is stateless. It removes a leaf and then naively sets the active leaf to this.leaves[0], which is the first tab in the list (visually rightmost in the current implementation). It has no memory of the previously active leaf, which is why the focus is lost.
View vs. Leaf Confusion: The code is treating a "view" change as a "leaf" change. The ApplyView should be a different state of the current leaf, not an entirely new leaf. This is a common pitfall when mocking complex UI systems like Obsidian's workspace.
Incomplete API Mock (TFile): The TypeScript error is a clear symptom of a mock API (web-poc/src/lib/obsidian-api.ts) that hasn't kept pace with the needs of the core plugin code. The plugin logic relies on basename and vault properties which are missing from the mock.
Lack of a "Previous State" Mechanism: The workspace mock lacks a mechanism to store and restore the previous state of a leaf. When switching to the ApplyView, we lose the context of the MarkdownView that was there before. To revert, we need to explicitly save and restore this state.
From these possibilities, the most probable causes are #1 (Incorrect Leaf Creation Strategy) and #4 (Incomplete API Mock). They represent the most direct and verifiable sources of the two primary bugs described.
Proposed Solutions and Implementation Plan
Based on the PRD's recommendations and my verification, here are the top three improvements we can make, broken down into simple, iterative steps:
Achieve High-Fidelity TFile Mock: This is the most straightforward fix and will resolve the blocking TypeScript error. It's a prerequisite for testing the rest of the flow.
Implement View Swapping instead of New Leaf Creation: This is the core fix for the user experience bug. It involves changing the logic to reuse the active leaf for the ApplyView.
Gracefully Return to Editor View: After the ApplyView is closed, we must ensure the user is returned to the editor for the file they were working on. This requires managing the leaf's state.
I will now proceed with the implementation, starting with the first and most critical fix. I'll begin by creating a to-do list to track our progress.

## 6. End-to-End "Apply" Pipeline (Chronological Detail)

Below is the complete sequence of function calls, data transformations, and view transitions that occur when a user presses **Apply** on a markdown diff block.  Line numbers reference the current code base to aid debugging.

1. **UI Event** – `Chat.tsx` `handleApply` (≈ line 420)
   - Grabs the currently active `TFile` via `app.workspace.getActiveFile()`.
   - Reads the file content with `readTFileContent`.
   - Looks up the configured chat model + provider (`getChatModelClient`).
   - Calls `applyChangesMutation.mutate` with `{ blockToApply, currentFile, currentFileContent, … }`.
2. **React-Query Mutation** – `applyChangesMutation` (≈ line 260)
   - Delegates to `applyChangesToFile` in `src/utils/chat/apply.ts`.
3. **Prompt Construction & LLM Call** – `applyChangesToFile`
   1. **System message** – `systemPrompt` (hard-coded string, see § 7).
   2. **User message** – generated by `generateApplyPrompt` which concatenates:
      - Target file path + full content
      - Up to 10 chat history messages (each pre-processed to strip non-relevant block noise)
      - *Exactly one* `<smtcmp_block>` containing the requested edits
   3. Sends `RequestMessage[]` to `providerClient.generateResponse` (no streaming).
4. **Response Post-Processing** – `extractApplyResponseContent`
   - Strips ``` fences if present → `newContent` (entire rewritten file).
5. **Diff Generation** – back in `applyChangesMutation.onSuccess`
   - Uses `createPatch` from `diff` to compute a unified patch string.
6. **View Presentation**
   - **Current Implementation:**
     ```ts
     const leaf = app.workspace.getLeaf(true); // creates *new* tab
     await leaf.setViewState({ type: APPLY_VIEW_TYPE, … });
     ```
   - **Desired Implementation:** reuse `app.workspace.activeLeaf` and **swap** the view instead of creating a new one.
7. **User Interaction in `ApplyViewRoot`**
   - `Accept` → `vault.modify(file, mergedContent)` then `close()`
   - `close` currently calls `leaf.detach()` which pops the entire tab.
8. **Leaf Detachment** – `Workspace.detachLeaf` (mock)
   - Removes leaf from `this.leaves` then naïvely sets `activeLeaf = this.leaves[0]` – the origin of the focus bug.

## 7. Internal Prompt Breakdown

### 7.1 System Prompt (`src/utils/chat/apply.ts`)
```text
You are an intelligent assistant helping a user apply changes to a markdown file.

You will receive:
1. The content of the target markdown file.
2. A conversation history between the user and the assistant…
3. A single, specific markdown block extracted from the conversation history…

Please rewrite the entire markdown file with ONLY the changes from the specified markdown block applied… Output only the file content, without any additional words or explanations.
```

### 7.2 Generated User Prompt (High-level Structure)
```
# Inputs

## Target File
```<path/to/file.md>
<full current file content>
```

## Conversation History
[User]: …
[Assistant]: …
[Tool]: …

## Changes to Apply
<smtcmp_block>
<blockToApply>
</smtcmp_block>

Now rewrite the entire file…
```

### 7.3 Message Array Sent to the LLM
1. `{ role: "system", content: systemPrompt }`
2. `{ role: "user",   content: generateApplyPrompt(…) }`

No assistant/tool messages are sent in this request – the LLM’s **first token** is expected to be the new file fenced with ```.

## 8. Top Three Likely Causes of the Tab Bug in the Web Port

1. **Leaf Creation Parity Mismatch** – Using `getLeaf(true)` forces a brand-new `WorkspaceLeaf` instead of leveraging the existing active leaf as Obsidian does for in-pane view swaps.
2. **Stateless `detachLeaf` Implementation** – The mock’s `detachLeaf` forgets prior focus and sets `activeLeaf` to `this.leaves[0]` (right-most tab).  Native Obsidian maintains a stack to restore the previous pane.
3. **Missing `previousViewState` Cache** – The mock does not remember the Markdown view state before the swap.  Consequently, returning from `ApplyView` requires re-initializing a MarkdownView rather than simply restoring a cached one.

## 9. Three High-Impact, Low-Risk Improvements

1. **Swap View in Place**
   - Change `applyChangesMutation` to `const leaf = app.workspace.activeLeaf ?? app.workspace.getLeaf();` followed by `leaf.setViewState({ … })`.
2. **Augment `Workspace.detachLeaf`**
   - Maintain `viewHistory: WorkspaceLeaf[]` stack.
   - On `setActiveLeaf`, push; on `detachLeaf`, pop and restore the previous active leaf if present.
   - <5 LOC change + one new array field.
3. **Cache & Restore Markdown ViewState**
   - Before swapping to `ApplyView`, capture `const previous = leaf.getViewState();` and stash it in the `state` passed to `ApplyViewRoot`.
   - `handleCloseApplyView` (new) will call `leaf.setViewState(previous)` instead of detaching.


