# Project Briefing: Web-Based Obsidian API Proof-of-Concept

## 1. Project Goal

The primary objective of this initiative is to create a web-based proof-of-concept (POC) that serves as a foundation for a new internal notation application. The core strategic goal is to adapt the powerful plugin ecosystem of Obsidian to our own platform. By replicating the Obsidian Plugin API, we aim to enable the seamless porting of existing open-source Obsidian plugins, significantly accelerating feature development and providing a rich, extensible user experience from the outset.

## 2. Guiding Principles & Strategy

Our approach is guided by a commitment to creating a high-fidelity, backend-agnostic, and modular foundation.

*   **API First:** The highest priority is replicating the Obsidian Plugin API (`app`, `vault`, `workspace`). This compatibility layer is the key to our strategy, as it will allow us to leverage the vast library of existing Obsidian plugins with minimal modification.
*   **Local-First Simulation:** To accelerate development and maintain simplicity for the POC, we are simulating the "vault" (the user's collection of notes and files) using browser-native technologies. The file system is mocked using an in-memory `Map`, with plans to persist data to `localStorage` in the future. This design ensures the API remains backend-agnostic, allowing for a future transition to cloud-based storage (e.g., Cloudflare R2/D1) without altering the plugin-facing API.
*   **Component-Based UI:** We are using a modern, component-based UI architecture with React and TypeScript, leveraging the existing setup of the Smart Composer plugin. This promotes modularity and maintainability, allowing UI components to be updated or replaced independently.

## 3. Implementation Details

The POC was built within a new `web-poc` directory to leverage the existing repository's tooling and context.

*   **Scaffolding:** The project is scaffolded with `Vite`, providing a fast and modern development environment with React and TypeScript support.
*   **API Layer (`obsidian-api.ts`):** This is the core of the POC. It exports a singleton instance of an `App` class, which contains `vault` and `workspace` objects.
    *   `Vault`: Manages files and folders. In this POC, it's an in-memory `Map` that simulates reading, writing, and deleting files. It uses a browser-compatible `EventEmitter` (`eventemitter3`) to emit events like `create`, `delete`, and `modify`, mirroring Obsidian's event-driven architecture.
    *   `Workspace`: Manages the UI state, such as the currently active file. It also uses an `EventEmitter` to notify other components of state changes (e.g., `file-open`).
*   **UI Components:**
    *   `FileTreeView.tsx`: Displays the list of files from the `vault`, subscribes to its events to stay in sync, and provides UI for creating new files and running API tests.
    *   `MarkdownEditor.tsx`: Initially a simple `<textarea>`, it has been upgraded to use the `@uiw/react-markdown-editor` component, providing a rich editing experience with syntax highlighting and a live preview. It interacts directly with the `vault` API to read and write file content.
*   **API Testing:** An integrated "Run API Tests" button programmatically executes `create`, `read`, `write`, and `delete` operations against the `vault` API, logging results to the console to ensure its integrity.

## 4. To-Do List

### Completed Tasks

-   [x] Scaffold `web-poc` project with Vite and React.
-   [x] Implement initial in-memory `Vault` and `Workspace` API mock.
-   [x] Create a `FileTreeView` component to display and manage files.
-   [x] Create a basic `textarea`-based markdown editor.
-   [x] Fix browser compatibility issue by replacing Node's `EventEmitter` with `eventemitter3`.
-   [x] Implement an in-app API test runner to verify core functionality.
-   [x] Upgrade the editor from a `<textarea>` to the `@uiw/react-markdown-editor` component.

### Next Steps

-   [ ] **Persistence:** Implement `localStorage` persistence for the in-memory vault so that notes are not lost on page refresh.
-   [ ] **Folder Support:** Enhance the `Vault` API and `FileTreeView` component to support the creation and display of folders for better organization.
-   [ ] **Plugin Loader:** Design and implement a mechanism to dynamically load an external, ported Obsidian plugin to test the API's fidelity.
-   [ ] **UI Enhancements:** Improve UI/UX with features like file renaming, deleting from the UI, and a more polished design.
-   [ ] **Cloud Integration:** Begin planning the transition from local simulation to a production-ready cloud backend (e.g., Cloudflare D1 for metadata and R2 for file content).
