# PRD: Plugin Settings System for Web-Based Editor POC

## 1. Objective

This document outlines the requirements for building a plugin settings system within the web-based editor proof-of-concept (POC). The primary goal is to implement the functionality required to display and manage settings for ported Obsidian plugins, using **Smart Composer** as the initial implementation target. This effort is critical for advancing the fidelity of our mock Obsidian API, specifically by implementing the `addSettingTab` functionality, which is a key part of the plugin lifecycle for any complex plugin. Successfully rendering the Smart Composer settings will validate our ability to support plugins that require user configuration, moving us closer to a fully-featured, extensible platform.

**Status: Completed.** The core functionality has been implemented and debugged.

### Referenced Components:

*   **Plugin:** [Smart Composer](../../README.md)
*   **Plugin Settings Component:** [src/settings/SettingTab.tsx](../../src/settings/SettingTab.tsx)
*   **Target Application API:** [web-poc/src/lib/obsidian-api.ts](../../web-poc/src/lib/obsidian-api.ts)
*   **Previous PRD:** [implementation.md](./implementation.md)

## 2. Analysis of Integration Strategies

We have two primary strategies for integrating plugin settings into the web editor. These approaches represent a trade-off between rapid, specific implementation and a more robust, long-term, and scalable architecture.

One approach is to **create a dedicated, hardwired settings page for the Smart Composer plugin**. In this scenario, the web POC would be explicitly aware of the Smart Composer plugin and its `SettingTab` React component. We would create a new route or modal in the web application that directly imports and renders this component. The entry point, such as a settings button in the UI, would be statically linked to this page. This method is direct and guarantees a fast implementation for our immediate target. It would allow us to focus on the UI and state management of the settings panel itself without building out the underlying API abstraction first. This prioritizes getting the visible feature working quickly, deferring the work of creating a generic system.

Alternatively, we could **implement a generic, API-driven settings management system that mirrors Obsidian's native functionality**. This strategy involves extending our mock Obsidian API in `obsidian-api.ts` with a functional `addSettingTab` method. Plugins like Smart Composer would call this method on `onload`, registering their settings component with the core application. The web POC would then dynamically build the settings modal, populating the navigation with all registered plugins and rendering the appropriate component when selected. This approach is more abstract and requires more upfront work on the API, but it directly serves the project's core goal of building a flexible, plugin-agnostic platform. It forces us to build the system correctly from the start, ensuring that future plugin ports will work seamlessly without changes to the web POC's core.

## 3. Recommendation

While a hardwired solution would be faster, the **API-driven settings system is the clearly superior approach**.

The foundational objective of this project is to create a high-fidelity mock of the Obsidian API that enables the "seamless porting" of existing plugins. Bypassing the API for a core feature like settings would undermine this goal and create technical debt. A generic implementation forces us to confront and solve the real architectural challenges of a modular system. It ensures that our `obsidian-api.ts` becomes more complete and robust. By implementing `addSettingTab` correctly now, we validate that our architecture can support a fundamental plugin interaction, creating a reusable pattern for all future plugins and confirming the viability of our entire strategy.

## 4. Next Steps

### Phase 1: API and Core UI Implementation

1.  **API Extension (`obsidian-api.ts`):**
    *   In `obsidian-api.ts`, define a new `PluginSettingTab` base class. It should include `constructor(app, plugin)`, an `id` property derived from the plugin's ID, a `name` for display, and `display()` and `hide()` methods.
    *   In the mock `App` class, add a `settingTabs` array and an `addSettingTab(tab: PluginSettingTab)` method to register instances.
2.  **Create Settings Modal (`SettingsModal.tsx`):**
    *   Develop a new reusable `SettingsModal` component in the `web-poc`.
    *   This modal will feature a two-column layout: a left-side navigation for plugin names and a right-side content area.
    *   The modal will read the registered `settingTabs` from the `app` instance and dynamically generate the navigation list.
    *   Clicking a navigation item will call the `display()` method of the corresponding `PluginSettingTab` instance, passing the content area's `HTMLElement` as an argument.

### Phase 2: Plugin Adaptation and Rendering

3.  **Adapt Plugin's Setting Tab (`SettingTab.tsx`):**
    *   Modify the Smart Composer's `SettingTab` class (in `src/settings/SettingTab.tsx`) to extend the new `PluginSettingTab` from our mock API.
    *   Implement the `display()` method. Inside `display()`, it will use React's `createRoot` to render the existing `<SettingsTabRoot />` component into the `containerEl` provided by the `SettingsModal`.
4.  **Plugin Lifecycle Integration (`main.ts`):**
    *   Verify that the `SmartComposerPlugin`'s `onload` method in `src/main.ts` correctly instantiates its `SettingTab` and registers it by calling `this.addSettingTab()`. No changes should be needed if it already matches Obsidian's standard pattern.

### Phase 3: UI Entry Point and Testing

5.  **Add Settings Entry Point:**
    *   In the main `App.tsx` of the `web-poc`, add a new icon button (e.g., a gear icon) to the ribbon area.
    *   Clicking this button will open the `SettingsModal`.
6.  **End-to-End Test:**
    *   Perform a full user-flow test:
        1.  Load the application and verify the settings (gear) icon appears in the ribbon.
        2.  Click the icon to open the settings modal.
        3.  Verify "Smart Composer" appears in the navigation list.
        4.  Click "Smart Composer" and confirm its full settings panel renders correctly in the content area.
        5.  Change a setting, close the modal, and reopen it to ensure the setting change was persisted (leveraging the existing `loadData`/`saveData` mocks).

## 5. Implementation Notes & Challenges

The implementation process revealed several challenges related to mocking the Obsidian API and integrating it with React's lifecycle. The following notes document the key problems and their resolutions:

1.  **Mock API Incompleteness:** Initial attempts to render the settings tab failed due to `TypeError` exceptions. The root cause was that the mock components in `obsidian-api.ts` (e.g., `Setting`, `DropdownComponent`, `ToggleComponent`) and the `HTMLElement.prototype` were missing methods (`createDiv`, `clear`, `setAttrs`) and properties (`settingEl`, `selectEl`) that the React components relied on.
    *   **Resolution:** The mock API was significantly enhanced. We added polyfills for missing `HTMLElement` methods and fleshed out the mock component classes to build a DOM structure that faithfully mirrors the real Obsidian API.

2.  **Duplicate Key Warnings in React `StrictMode`:** The settings tabs were rendered with duplicate keys, causing React warnings. This was traced back to React's `StrictMode` intentionally calling `useEffect` setup and cleanup logic twice in development. The plugin's `onload` method was being called twice, and our initial `addSettingTab` implementation was not idempotent.
    *   **Resolution:** The `addSettingTab` method in the mock `App` class was made idempotent. It now checks if an identical tab already exists before adding it to the `settingTabs` array. This provides a robust, centralized fix.

3.  **Blank Page on Second Modal Open:** After closing and reopening the settings modal, the content pane would appear blank.
    *   **Resolution:** This was a state management issue. We added a `useEffect` hook to the `SettingsModal` component to reset its internal `activeTab` state to `null` whenever the modal is closed. This ensures it re-initializes correctly every time it's opened.

4.  **React Render Race Condition:** When switching tabs or closing the modal, a warning about "synchronously unmounting a root while React was already rendering" would appear. The tab's `hide()` method was calling `root.unmount()` while React was still in its own render cycle.
    *   **Resolution:** The unmount call in `SmartComposerSettingTab.hide()` was wrapped in a `setTimeout(..., 0)`. This defers the unmount operation, allowing React to complete its current render task and preventing the race condition.
