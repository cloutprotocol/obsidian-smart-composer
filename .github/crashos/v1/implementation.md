# PRD: Integrating Smart Composer Plugin into Web-Based Editor POC

## 1. Objective

This document outlines the requirements for integrating the **Smart Composer** plugin into our web-based editor proof-of-concept (POC). The primary goal is to validate the fidelity and completeness of our mocked Obsidian API, as detailed in the [project brief](editor.md). Successfully porting a complex, feature-rich plugin like Smart Composer will serve as the first major validation of our core strategy: enabling the seamless adoption of existing Obsidian plugins to accelerate our platform's development.

### Referenced Components:

*   **Plugin:** [Smart Composer](../../README.md)
*   **Target Application API:** [web-poc/src/lib/obsidian-api.ts](../../web-poc/src/lib/obsidian-api.ts)

## 2. Analysis of Integration Strategies

We have two primary strategic options for integrating the Smart Composer plugin into the web editor. Each approach has distinct advantages and implications for the future of the project.

One path is to **hardwire the plugin as a core feature**. This approach treats the AI composition tools not as an extension, but as a fundamental component of the editor's value proposition. By tightly coupling the plugin's logic with the editor's core, we could achieve a highly optimized and seamless user experience out-of-the-box. This ensures that our most powerful features are immediately accessible and deeply integrated, forming the central pillar of the product's identity and marketing. This strategy prioritizes immediate product value and a polished initial offering, ensuring all users benefit from the AI capabilities without any setup.

Alternatively, we could treat Smart Composer as a **standalone plugin and focus on porting it** to our mock API. This approach directly serves our strategic goal of building a flexible, extensible platform. It would force us to rigorously test and expand our API, ensuring it is robust enough to handle real-world plugin demands for file system access, UI manipulation, and event handling. The process would serve as a crucial dogfooding exercise, allowing us to create a clear set of documentation and a blueprint for porting other plugins in the future. This path prioritizes the long-term health and modularity of the platform, validating the API-first strategy and proving the viability of our ecosystem play.

## 3. Recommendation

While both options have merit, the **standalone plugin port is the clearly superior approach** for this stage of the project.

The foundational goal of this POC, as stated in the project brief, is to replicate the Obsidian API to "enable the seamless porting of existing open-source Obsidian plugins." Hardwiring the first major plugin, however appealing for the user experience, would fail to validate this core premise. It would be a shortcut that leaves our central hypothesis—that we can build a compatible API—untested.

By committing to a true port, we force ourselves to build the necessary infrastructure, such as a plugin loader, and confront any gaps in our `obsidian-api.ts` implementation. This process is the most effective way to ensure we are building a genuinely modular and extensible system. Successfully porting the Smart Composer plugin as a separate entity provides tangible proof that our strategy is sound and delivers a clear roadmap for integrating the vast library of existing plugins.

## 4. Next Steps

### Phase 1: Foundational API Implementation

1.  **Plugin Lifecycle & Data:**
    *   In `obsidian-api.ts`, create a `Plugin` base class with `onload` and `onunload` stubs.
    *   Implement `loadData` and `saveData` methods on the `Plugin` class to use `localStorage` for persistence, simulating the plugin settings storage.
2.  **Basic Workspace & Views:**
    *   Expand the mock `Workspace` class to manage a collection of "leaves" (view containers).
    *   Implement `registerView(viewType, constructor)` in the `App` class to store custom view constructors.
    *   Implement `getLeavesOfType(viewType)` and `getRightLeaf(create: boolean)` to allow plugins to request and manage views.
3.  **UI Primitives:**
    *   Implement a global `Notice` class that creates a simple, temporary notification element on the screen.
    *   Create a mock `addRibbonIcon(icon, title, callback)` that adds a clickable button to a dedicated "ribbon" area in the UI.

### Phase 2: Plugin Adaptation & Core Feature Porting

4.  **Plugin Loader:**
    *   Create a simple plugin loader in the `web-poc` that imports the `SmartComposerPlugin` class, instantiates it, and calls its `onload` method, passing our mock `app` instance.
5.  **Initial Plugin Adaptation:**
    *   Adapt the `SmartComposerPlugin`'s `main.ts` to run in the browser. This will involve removing Node.js-specific dependencies and resolving any initial compilation errors.
6.  **Port the Chat View:**
    *   Focus on getting the `ChatView` to render. This involves implementing the `ItemView` class it extends and mocking the `WorkspaceLeaf` it requires.
    *   Stub out the methods needed for the chat view to open and display, even with limited functionality (`setViewState`, `revealLeaf`).

### Phase 3: Functionality & Integration Testing

7.  **Command Palette Simulation:**
    *   Implement `addCommand(command)` in the `Plugin` class.
    *   Create a simple "Command Palette" UI in the `web-poc` that lists and allows the execution of registered commands (e.g., "Open chat").
8.  **Editor Integration:**
    *   Implement mock `Editor` and `MarkdownView` classes.
    *   Focus on the `addCommand` that uses `editorCallback` to get selected text, enabling the "Add selection to chat" feature. This is a critical integration point with the editor component.
9.  **End-to-End Test:**
    *   Perform a full user-flow test:
        1.  Click the ribbon icon to open the chat view.
        2.  Use the command palette to open the chat view.
        3.  Select text in the editor and use the "Add selection to chat" command.
        4.  Verify that settings changes made in the UI are persisted to `localStorage`.