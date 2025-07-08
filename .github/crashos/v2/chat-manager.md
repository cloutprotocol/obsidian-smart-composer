# PRD: Porting Chat Stream Management to Web POC

## 1. Objective

This document outlines the requirements for porting the `useChatStreamManager` hook and its associated dependencies to the web-based editor proof-of-concept (POC). The primary goal is to enable live, streaming chat functionality, which is the core interactive feature of the **Smart Composer** plugin. Successfully implementing this component will validate our ability to support complex, asynchronous, and stateful plugin logic that goes beyond simple API mocking and interacts with external services from the browser.

### Referenced Components:

*   **Core Logic:** `src/components/chat-view/useChatStreamManager.ts`
*   **Primary Consumer:** `src/components/chat-view/Chat.tsx`
*   **Key Dependencies:** `ResponseGenerator`, `PromptGenerator`, LLM providers, `mcp-context`, `rag-context`.

## 2. Analysis of Integration Strategies

To enable chat streaming in the web POC, we must address how the `useChatStreamManager` hook and its deep dependency tree will function in a browser environment.

One approach is to **create a high-fidelity mock of the entire chat stream pipeline**. In this strategy, we would replace `useChatStreamManager` in the POC with a substitute that simulates the streaming behavior without making actual network calls. It would emit pre-canned response chunks on a timer, mimicking a real LLM interaction. This would allow us to quickly test the UI's ability to render a stream and handle user interactions like stopping generation, but it would not validate our architecture for handling real-world network conditions, API keys, or CORS policies. It's a UI-first approach that defers solving the harder backend and networking challenges.

Alternatively, we can **port the an `useChatStreamManager` by adapting its dependencies for the browser**. This involves making the real hook and its underlying `ResponseGenerator` and LLM provider classes work directly in the web environment. This path forces us to confront the inherent challenges of moving from a desktop (Electron) to a browser context, such as managing API keys securely, handling Cross-Origin Resource Sharing (CORS) for LLM API endpoints, and providing browser-compatible versions of dependencies like the RAG and MCP engines. This strategy is more complex but directly aligns with our main goal: ensuring the original plugin code can run in both environments with minimal changes.

## 3. Recommendation

While a mocked stream would be faster, the **direct port of `useChatStreamManager` and its dependencies is the superior strategy**.

The core objective of this project, as outlined in the [initial implementation plan](../implementation.md), is to prove the viability of our mock Obsidian API for running complex, real-world plugins. The chat functionality is the most critical and complex part of Smart Composer. By choosing the direct port, we are forced to solve the exact problems that any third-party plugin developer would face, namely networking and managing external services from the browser.

This process will serve as an invaluable dogfooding exercise. We will start by disabling the most complex dependencies (RAG and Tools/MCP) and focus on the fundamental LLM call. This incremental approach will allow us to build out the necessary infrastructure for the web POC, such as providing React contexts and handling API calls, creating a robust foundation for subsequent features.

## 4. Next Steps

### Phase 1: Environment and Context Setup

1.  **Resolve Module Pathing:**
    *   The TypeScript/bundler configuration for the web POC needs to correctly resolve module paths from the shared `src` directory. The error `Cannot find module './useChatStreamManager'` in `Chat.tsx` indicates a path resolution issue that must be fixed in the `web-poc`'s build tooling (`vite.config.ts`, `tsconfig.json`).
2.  **Provide React Contexts:**
    *   In the `web-poc/src/App.tsx`, wrap the main component tree with the necessary context providers that `useChatStreamManager` and its children depend on: `SettingsProvider`, `AppProvider`, `RAGProvider`, and `MCPProvider`.
    *   Initially, the `RAGProvider` and `MCPProvider` can provide `null` or mock implementations that return no data or do nothing. The plugin's logic is already designed to be resilient to their absence.

### Phase 2: Adapting Core Dependencies

3.  **LLM Provider Integration:**
    *   The various LLM providers in `src/core/llm/` use `fetch`, which is browser-compatible. The immediate challenge will be CORS.
    *   **Action:** For the POC, we will test direct API calls. If blocked by CORS, we will implement a simple proxy within the `web-poc/src/worker.ts` to forward the requests, isolating the web-specific logic from the core plugin code.
4.  **Disable Advanced Features via Settings:**
    *   Use the mocked `loadData`/`saveData` system to configure the plugin's settings within the POC.
    *   Specifically, set `settings.chatOptions.enableTools` to `false` and ensure any features that trigger vault searching (RAG) are disabled by default in the UI. This narrows our focus to the core chat streaming. `useChatStreamManager` and `ResponseGenerator` are already designed to bypass tool-use and RAG when disabled.

### Phase 3: Integration and Testing

5.  **End-to-End Stream Test:**
    *   With the context and dependencies in place, perform a full user flow test:
        1.  Type a message in the `ChatUserInput`.
        2.  Submit the message.
        3.  Verify a real network request is sent to the configured LLM provider (e.g., OpenAI).
        4.  Verify the response streams back and is rendered correctly in the `Chat.tsx` component.
        5.  Test the "Stop Generation" button to ensure the `AbortController` logic functions correctly.
6.  **Error Handling Validation:**
    *   Test known error conditions, such as providing an invalid API key.
    *   Verify that the `LLMAPIKeyInvalidException` is caught and the `ErrorModal` is displayed correctly, confirming that our mocked `Modal` class and its usage are working as intended.
