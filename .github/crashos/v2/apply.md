# PRD: Reverse-Engineering and Implementing the `ApplyView` Flow

## 1. Problem Statement

While the web-poc can now handle basic file edits without crashing, the primary plugin feature of applying AI-suggested changes is non-functional. Clicking the "Apply" button on a code block in the chat view does not trigger any visible action. The underlying logic, which is supposed to calculate a diff and display it in a custom `ApplyView`, is failing silently. We must reverse-engineer this workflow to build out the necessary API mocks and UI logic to support it.

## 2. Goal

The objective is to make the "Apply" button fully operational. A user must be able to click "Apply" on a suggested code change, see a dedicated diff view, and accept that change, resulting in the modification of the target file. This will validate the most critical piece of the plugin's functionality in the web-poc environment.

## 3. Reverse-Engineering & Implementation Plan

Our investigation suggests the breakdown occurs within the `applyChangesToFile` utility. We need to trace its execution and mock the Obsidian API methods it relies on.

### Phase 1: Trace the "Apply" Action

1.  **Start at the Source:** The user clicks "Apply" in `MarkdownCodeComponent.tsx`. This calls the `onApply` prop.
2.  **Follow the Prop:** Trace `onApply` up to `ChatView.tsx` and its hooks. It eventually calls `applyChangesToFile` located in `src/utils/chat/apply.ts`.
3.  **Instrument `applyChangesToFile`:** Add logging inside `applyChangesToFile` to determine exactly where it's failing. Key areas to watch are `app.workspace.getLeaf(true)` and `leaf.setViewState()`. This will tell us what our mock API is missing.

### Phase 2: Enhance the Mock Workspace

1.  **Analyze `getLeaf` Usage:** The `applyChangesToFile` function calls `app.workspace.getLeaf(true)` to create a new tab for the diff view. We must ensure our mock implementation correctly creates and returns a new, properly configured `WorkspaceLeaf` that is ready to accept a new view.
2.  **Verify `revealLeaf`:** The plugin may use `revealLeaf` to show the new view. We must confirm our mock `revealLeaf` correctly places the view in the main content area without improperly stealing focus from the active editor.
3.  **Implement `setState` in `ApplyView`:** The `applyChangesToFile` function passes the diff data via `leaf.setViewState({ state: { ... } })`. While our mock `ItemView` has a `setState` stub, the actual `ApplyView.tsx` component needs to implement this method to receive the `originalFile`, `newContent`, and `diff` data and store it in its own React state to trigger a re-render.

### Phase 3: Wire the `ApplyView` Component

1.  **Render the Diff:** Once `ApplyView` receives the data via `setState`, it must render the diff. We need to ensure its internal rendering logic, which likely uses a third-party diffing library, works correctly in the browser.
2.  **Implement "Accept" Button Logic:** The "Accept" button's `onClick` handler inside `ApplyView.tsx` must be wired to call `this.app.vault.modify()` with the new content.
3.  **Implement "Close" Logic:** After accepting or rejecting, the view must close itself by calling `this.leaf.detach()`. Our mock API already supports this, but we need to ensure it's called correctly from the component's event handlers.

## 4. Success Metrics

- **Diff View Appears:** Clicking the "Apply" button opens a new tab titled "Applying: [filename]".
- **Diff is Visible:** The new tab correctly renders a visual diff of the proposed changes.
- **Acceptance Works:** Clicking the "Accept" button in the diff view instantly updates the content in the original file's editor tab.
- **View Closes on Accept:** The "Applying..." tab closes automatically after the "Accept" button is clicked.
- **Rejection Works:** Clicking a "Reject" or "Cancel" button closes the "Applying..." tab without changing the original file.
