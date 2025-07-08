# PRD: Achieving Full Settings Persistence in the Web-POC

## 1. Problem Statement

While the web-based proof-of-concept (web-poc) currently persists some basic settings (e.g., selected chat model) using a `localStorage`-based mock of Obsidian's `loadData`/`saveData` API, it does not fully support the entire settings structure of the Smart Composer plugin. The plugin's settings are comprehensive, including nested objects for provider configurations, custom chat and embedding models, RAG options, and MCP server details. The current implementation falls short of a 1:1 clone because complex settings edited or added through the settings modal are not being correctly saved and reloaded, leading to an incomplete and inconsistent user experience.

## 2. Goal

The objective is to implement a robust and complete settings persistence layer in the web-poc that fully mirrors the behavior of the real Smart Composer plugin in Obsidian. This means that *every* change made in the settings modal—from adding a new provider and API key to modifying RAG chunk size or managing MCP servers—must be accurately saved to `localStorage` and successfully reloaded when the application is refreshed. Achieving this will enable realistic testing of all dependent features and significantly advance the fidelity of our mock Obsidian environment.

## 3. Analysis & Implementation Plan

Our investigation confirms that a mock `loadData`/`saveData` API using `localStorage` is already in place. The core issue is that the web-poc's UI components and state management are not yet fully wired to handle the entire `SmartComposerSettings` object defined in `src/settings/schema/setting.types.ts`. The `zod` schema's use of `.catch()` to provide default values masks the underlying problem by preventing crashes, but it also prevents an accurate representation of user-configured settings.

The plan is to systematically ensure every part of the settings UI correctly interacts with the central `SettingsProvider`.

### Phase 1: Solidify Provider and Model Management

1.  **Verify "Add Provider" Flow**: The user can add new LLM providers (OpenAI, Anthropic, etc.).
    *   **Action**: Open the settings modal, navigate to the "Providers" section, and click "Add".
    *   **Implementation**: Ensure the `ProviderFormModalRoot` component correctly captures the new provider data (name, API key, etc.).
    *   **State Update**: On submission, the new provider object must be added to the `providers` array within the main settings object, and `setSettings` must be called with the *entire*, updated settings object.

2.  **Verify "Add Chat/Embedding Model" Flow**: The user can add custom models associated with a provider.
    *   **Action**: In the "Models" section, click "Add" for either chat or embedding models.
    *   **Implementation**: Ensure the `AddChatModelModalRoot` and `AddEmbeddingModelModalRoot` correctly create new model objects.
    *   **State Update**: The new model must be added to the `chatModels` or `embeddingModels` array, and `setSettings` must be called to persist the change.

3.  **Verify Deletion**: Ensure that deleting a provider or model correctly removes it from the corresponding array in the settings and saves the updated state.

### Phase 2: Implement RAG and Chat Options Persistence

1.  **Wire Up RAG Settings**: The "RAG" section of the settings tab contains several inputs (chunk size, limit, similarity, etc.).
    *   **Action**: Modify the values in the RAG settings inputs.
    *   **Implementation**: For each input (`ObsidianTextInput`, etc.), ensure its `onChange` handler updates the corresponding field within the `ragOptions` object in the settings state.
    *   **State Update**: Every change must trigger a call to `setSettings` with the updated top-level settings object. This includes managing the "Excluded Files" and "Included Files" lists, which modify the `excludePatterns` and `includePatterns` arrays.

2.  **Wire Up Chat Options**: The "Etc." section contains toggles and inputs for chat behavior.
    *   **Action**: Toggle `includeCurrentFileContent` or `enableTools`, or change `maxAutoIterations`.
    *   **Implementation**: Wire the `onChange` handlers for these controls to update the `chatOptions` object.
    *   **State Update**: Call `setSettings` on every change.

### Phase 3: Validate MCP Server Configuration

1.  **Verify MCP Server Management**: The "MCP" section allows for adding, enabling/disabling, and configuring multiple MCP servers.
    *   **Action**: Add a new server, toggle its status, and edit its details.
    *   **Implementation**: The `McpSection.tsx` component and its associated modals (`McpServerModal.tsx`) must correctly manage the `mcp.servers` array.
    *   **State Update**: All operations (add, update, delete) on MCP servers must result in a `setSettings` call with the updated settings object.

## 4. Success Metrics

- **Full Persistence**: After configuring any setting, adding any model/provider, or modifying any option, a page refresh must restore the UI to its exact previous state.
- **Provider/Model Integrity**: Adding a new provider and a custom model, then selecting that model for chat, should persist across reloads.
- **RAG Configuration Works**: Modifying RAG settings (e.g., setting a unique chunk size) and refreshing will show the new value in the input field.
- **MCP Servers are Saved**: Adding and configuring an MCP server will result in that server being present and correctly configured after a reload.
- **No Data Loss**: Saving one part of the settings (e.g., adding a chat model) must not cause another part (e.g., RAG options) to revert to its default value. This will be validated by inspecting the `localStorage` entry to ensure the entire, correct object is being saved.
