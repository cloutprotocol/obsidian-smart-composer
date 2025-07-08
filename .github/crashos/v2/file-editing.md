# PRD: Reactive File Editing in Web POC

## 1. Problem Statement

Currently, the file editing experience in the web proof-of-concept is unreliable. While the UI allows text input, changes made by the user are not persisted correctly within the mock vault's state. Consequently, if a user edits a file, switches tabs, and returns, their changes are lost. Furthermore, edits initiated by the plugin's logic (e.g., applying a diff from the chat view) are not reflected in the editor, creating a disconnect between the plugin's state and the user interface. This breaks the core feedback loop required for an interactive editing environment.

## 2. Goal

The objective is to implement a fully reactive, bidirectional file editing system. Changes made in the `MarkdownEditor` must instantly and correctly update the underlying mock `Vault`. Conversely, any programmatic changes to a file's content by the plugin must be immediately rendered in the active editor view. This will ensure data integrity and provide a seamless, predictable user experience that mirrors the behavior of the native Obsidian application.

## 3. Proposed Solution

We will implement a robust, event-driven architecture to synchronize the state between the React UI and the mock Obsidian API.

### Phase 1: Establish a Reactive Vault Listener

1.  **Subscribe to Vault Events:** In the main `App.tsx` component, create a `useEffect` hook to subscribe to key events emitted by `app.vault`. The primary event to handle is `modify`.
2.  **Create State Update Handlers:** Develop handler functions that will be triggered by these events. The `onModify` handler will be the most critical.

### Phase 2: Implement State Synchronization Logic

1.  **Identify Active File Changes:** Inside the `onModify` event handler, check if the path of the modified `TFile` object matches the path of the currently active file.
2.  **Re-fetch and Update State:** If the active file has been modified, call `app.vault.read()` to get the fresh content.
3.  **Trigger Re-render:** Use the component's state setter (e.g., `setFileContent`) to update the UI with the new content, causing the `MarkdownEditor` to re-render with the latest text.

### Phase 3: End-to-End Validation

1.  **User Input Test:** Verify that typing text into the `MarkdownEditor` persists after switching tabs and returning to the file.
2.  **Plugin-Initiated Edit Test:** Trigger a plugin action that modifies the active file (e.g., using the "Apply" button in the `ChatView`). Confirm that the changes are instantly visible in the `MarkdownEditor` without requiring a manual refresh. This will validate the full, bidirectional data flow: `UI -> Vault -> UI` and `Plugin -> Vault -> UI`.

## 4. Success Metrics

- **Persistence:** User-typed content in the editor is preserved across tab switches.
- **Reactivity:** Programmatic file changes made by the plugin are reflected in the editor in real-time.
- **Data Integrity:** The content in the `MarkdownEditor` is always an accurate representation of the file's state within the mock `Vault`.
- **No Errors:** The console is free of errors related to file handles, state updates, or component rendering during editing operations.

### Phase 4: Port and Integrate the `ApplyView` Diff Component

1.  **Register the `ApplyView`:** The `ApplyView` is a custom view type (`"smtcmp-apply-view"`) that must be registered with the mock `app` instance. In `App.tsx`, after the plugin is loaded, we will manually call `plugin.registerView()` to make the application aware of this component.
2.  **Mock `leaf.detach()`:** The `ApplyView` closes itself by calling `this.leaf.detach()`. We must ensure our mock `WorkspaceLeaf` and `Workspace` classes correctly handle this by removing the leaf from the list of open leaves and updating the UI, similar to how we handled closing tabs.
3.  **Implement View Display Logic:** When the plugin tries to open the `ApplyView`, it will likely open it in a new leaf. We need to update our tab rendering logic in `App.tsx` to handle this new view type. It should render as a new tab, displaying the `getDisplayText()` result (e.g., "Applying: Untitled.md"). When this tab is active, its React content (the `ApplyViewRoot` component) should be rendered instead of the `MarkdownEditor`.
4.  **End-to-End Test:** The final validation will be to trigger a find-and-replace operation from the chat view.
    - Confirm the "Applying" tab appears.
    - Confirm the diff view is rendered correctly.
    - Click "Accept" and verify that the content in the original file's editor tab updates instantly to reflect the accepted change.
    - Verify that the "Applying" tab closes automatically.
