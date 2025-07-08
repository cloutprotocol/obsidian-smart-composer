# PRD: Porting Core Chat and File Editing to Web POC

## 1. Objective

This document outlines the requirements for porting the `useChatStreamManager` hook and its associated dependencies to the web-based editor proof-of-concept (POC). The primary goal is to enable core interactive features of the **Smart Composer** plugin: live, streaming chat, and AI-assisted file editing. Successfully implementing these components will validate our ability to support complex, asynchronous, and stateful plugin logic that goes beyond simple API mocking and interacts with a virtual file system from the browser.

### Referenced Components:

*   **Core Logic:** `src/components/chat-view/useChatStreamManager.ts`, `src/utils/chat/apply.ts`
*   **Primary Consumer:** `src/components/chat-view/Chat.tsx`
*   **Key Dependencies:** `ResponseGenerator`, `PromptGenerator`, LLM providers, `mcp-context`, `rag-context`, `app.vault.modify`.

## 2. Analysis of Integration Strategies

To enable chat streaming in the web POC, we must address how the `useChatStreamManager` hook and its deep dependency tree will function in a browser environment.

One approach is to **create a high-fidelity mock of the entire chat stream pipeline**. In this strategy, we would replace `useChatStreamManager` in the POC with a substitute that simulates the streaming behavior without making actual network calls. It would emit pre-canned response chunks on a timer, mimicking a real LLM interaction. This would allow us to quickly test the UI's ability to render a stream and handle user interactions like stopping generation, but it would not validate our architecture for handling real-world network conditions, API keys, or CORS policies. It's a UI-first approach that defers solving the harder backend and networking challenges.

Alternatively, we can **port the an `useChatStreamManager` by adapting its dependencies for the browser**. This involves making the real hook and its underlying `ResponseGenerator` and LLM provider classes work directly in the web environment. This path forces us to confront the inherent challenges of moving from a desktop (Electron) to a browser context, such as managing API keys securely, handling Cross-Origin Resource Sharing (CORS) for LLM API endpoints, and providing browser-compatible versions of dependencies like the RAG and MCP engines. This strategy is more complex but directly aligns with our main goal: ensuring the original plugin code can run in both environments with minimal changes.

## 3. Recommendation

While a mocked stream would be faster, the **direct port of `useChatStreamManager` and its dependencies is the superior strategy**.

The core objective of this project, as outlined in the [initial implementation plan](../implementation.md), is to prove the viability of our mock Obsidian API for running complex, real-world plugins. The chat functionality is the most critical and complex part of Smart Composer. By choosing the direct port, we are forced to solve the exact problems that any third-party plugin developer would face, namely networking and managing external services from the browser.

This process will serve as an invaluable dogfooding exercise. We will start by disabling the most complex dependencies (RAG and Tools/MCP) and focus on the fundamental LLM call. This incremental approach will allow us to build out the necessary infrastructure for the web POC, such as providing React contexts and handling API calls, creating a robust foundation for subsequent features.

## 4. Completed Milestones

### Phase 1: Environment and Context Setup

- [x] **Resolve Module Pathing:** The bundler configuration for the web POC now correctly resolves module paths from the shared `src` directory.
- [x] **Provide React Contexts:** `App.tsx` wraps the component tree with necessary providers (`SettingsProvider`, `AppProvider`, etc.), with `RAGProvider` and `MCPProvider` initially providing null implementations.
- [x] **Implement Dialog Container**: A dialog container has been added to `App.tsx` to handle modal rendering, and `Modal.ts` in the plugin has been adapted to use it.

### Phase 2: Adapting Core Dependencies

- [x] **LLM Provider Integration:** LLM providers from `src/core/llm/` are now functional in the browser, with a CORS proxy implemented in `web-poc/src/worker.ts` to handle cross-origin requests.
- [x] **Disable Advanced Features via Settings:** The mocked settings system is used to disable tool use (`enableTools: false`) and RAG features, narrowing the focus to the core chat stream.

### Phase 3: Integration and Testing

- [x] **End-to-End Stream Test:** A full user flow test is successful: typing a message, submitting it, seeing a real network request to an LLM, and having the response stream rendered correctly. The "Stop Generation" feature is also functional.
- [x] **Error Handling Validation:** Error conditions like invalid API keys are caught, and the mocked `ErrorModal` is displayed correctly.

## 5. Next Steps: File System Integration

The next major milestone is to enable the AI to edit files within the POC's virtual file system. The plugin's `ResponseGenerator` already parses `<smtcmp_block>` tags and calls `applyDiff` to patch file content. We need to implement the vault-level APIs to make these edits reflect in our POC's UI.

### Phase 4: Mocking the Vault for File Edits

1.  **Centralize File System State:**
    *   **Action:** In `web-poc/src/App.tsx`, introduce a state management solution (e.g., `useState`, `useReducer`) to hold the entire virtual file system, including file names and their content. This will serve as the single source of truth.
    *   **Example State Shape:**
        ```typescript
        interface VirtualFile {
          content: string;
        }
        type FileSystemState = Record<string, VirtualFile>; // filename -> file object
        ```
    *   **Initial State:** Populate the state with a few sample files (e.g., `Welcome.md`) to provide initial content for editing.

2.  **Implement `app.vault.modify`:**
    *   **Location:** `web-poc/src/lib/obsidian-api.ts`.
    *   **Action:** Implement the `modify(file, data)` method on the mock `vault` object. This function will receive the file path and new content from `applyDiff`. It must update the centralized `FileSystemState` in `App.tsx`.
    *   **Implementation Note:** This requires passing a state setter function from `App.tsx` down to the `obsidian-api` module or using a shared state management solution like Zustand or a React Context to avoid prop drilling.

3.  **Connect UI to File System State:**
    *   **`FileTreeView.tsx`**: This component should now render its list of files based on the keys of the `FileSystemState`. It should also manage which file is "active".
    *   **`MarkdownEditor.tsx`**: This component must display the `content` of the currently active file from the `FileSystemState`. Its `onChange` handler must update the state to allow for manual user edits, ensuring a two-way data binding.

4.  **End-to-End Test Plan:**
    1.  Start the web POC application and select a file (e.g., `Welcome.md`) from the `FileTreeView`.
    2.  Verify its content is displayed in the `MarkdownEditor`.
    3.  In the chat input, instruct the AI to change the content of the selected file (e.g., "change the heading to 'Hello Universe'").
    4.  Submit the message and observe the LLM stream.
    5.  Verify the `ResponseGenerator` correctly identifies the `<smtcmp_block>` and calls `applyDiff`.
    6.  Confirm that the mocked `app.vault.modify` is triggered, updating the `FileSystemState`.
    7.  Finally, validate that the `MarkdownEditor` automatically refreshes to display the new file content.
