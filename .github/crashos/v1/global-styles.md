# PRD: Global Styling Framework for Obsidian Plugin Porting

## 1. Objective

This document outlines the requirements for creating a global styling framework for the web-based editor POC. The primary goal is to bridge the visual gap between ported Obsidian plugins and their native appearance, as illustrated by the comparison between our current `Settings` implementation and the target Obsidian UI. By establishing a foundational CSS architecture that mimics Obsidian's design system, we can ensure that ported plugins like **Smart Composer** inherit a consistent and high-fidelity look-and-feel with minimal per-plugin effort. This initiative is crucial for fulfilling our core strategy of making plugin porting a seamless, low-friction process.

### Referenced Components:

*   **Previous PRD:** [PRD: Plugin Settings System](./settings.md)
*   **Plugin:** [Smart Composer](../../README.md)
*   **Target Application:** [web-poc](../../web-poc)

## 2. Analysis of Integration Strategies

Two primary strategies exist for aligning the visual style of ported plugins with the native Obsidian environment. These approaches represent a trade-off between immediate, targeted fixes and the development of a sustainable, scalable styling architecture.

One approach is to **implement scoped, per-plugin style overrides**. Under this model, as each new plugin is ported, a dedicated CSS file would be created to manually "correct" its appearance. For Smart Composer, we would write specific rules to adjust its background colors, font sizes, and control styles to match the Obsidian screenshot. This method is direct and allows for rapid, pixel-perfect adjustments on a case-by-case basis. It requires no upfront architectural work and allows us to address visual inconsistencies as they arise. However, this strategy is not scalable; it leads to significant code duplication, maintenance overhead, and a fragmented styling landscape where each plugin requires its own set of bespoke fixes.

The alternative, and more robust, strategy is to **develop a global CSS framework that recreates Obsidian's core UI protocols**. This involves a systematic analysis of Obsidian's design system to extract its foundational elements—CSS variables (for colors, fonts, spacing), default styles for standard HTML controls (`<input>`, `<select>`, `<button>`), and utility classes for layout. This framework would be loaded globally in our web POC, creating a "correction layer" that automatically styles ported plugins to be visually consistent with the Obsidian environment. Plugins would naturally inherit these styles, drastically reducing the need for custom overrides and ensuring that our mock API provides not just functional but also visual parity.

## 3. Recommendation

While per-plugin styling offers a quick fix, the **global CSS framework is the clearly superior long-term solution**.

Our core mission is to enable the "seamless porting" of plugins. A key part of that seamlessness is visual integration. A global framework directly serves this goal by creating a predictable and consistent styling environment. It is a "build it once, use it everywhere" solution that embodies the DRY (Don't Repeat Yourself) principle. By investing in this infrastructure now, we create a scalable system where future plugin ports will require dramatically less effort to integrate visually. This approach transforms our mock API from a purely functional replica into a high-fidelity platform, fulfilling the promise of a truly native-like experience and establishing the correct architectural pattern for all future development.

## 4. Next Steps

### Phase 1: Design Token and Variable Extraction

1.  **Inspect Obsidian's DOM:** Using browser developer tools on a live Obsidian instance, identify and document the core CSS custom properties (variables) used for colors (backgrounds, text, accents), fonts (family, sizes, weights), and spacing units.
2.  **Define Global Variables:** In a central stylesheet within the `web-poc` (e.g., `web-poc/src/style.css` or a new dedicated file), declare a `:root` selector and populate it with the extracted CSS variables. This will form the foundation of our design system.
    *   Example: `--background-primary`, `--text-normal`, `--interactive-accent`, etc.
3.  **Basic Body Styles:** Apply the core background and text color variables to the `body` element to set the global default appearance.

### Phase 2: Core Component Styling

4.  **Style Common Controls:** Create default, un-prefixed styles for standard form elements (`input[type="text"]`, `select`, `textarea`, `button`) to match Obsidian's look and feel. These styles should use the variables defined in Phase 1.
5.  **Implement Obsidian-Specific Components:** Recreate the CSS for Obsidian's custom UI components, most notably the toggle switch. This will likely involve targeting a specific class (e.g., `.checkbox-container`) and using pseudo-elements to construct the visual switch.
6.  **Style Structural Elements:** Define styles for common setting patterns, such as `.setting-item`, `.setting-item-info`, and `.setting-item-control`, to replicate Obsidian's layout, spacing, and vertical rhythm.

### Phase 3: Refactoring and Integration

7.  **Refactor Mock API:** Update the mock components in `web-poc/src/lib/obsidian-api.ts` (`Setting`, `addToggle`, `addDropdown`, etc.) to emit HTML with the necessary classes for our new global styles to apply correctly.
8.  **Test with Smart Composer:** Use the Smart Composer settings tab as the primary test case. Verify that with the new global CSS framework in place, its UI controls and layout automatically conform to the target Obsidian appearance with minimal to no plugin-specific CSS.

### Phase 4: Documentation

9.  **Document the Framework:** Create a brief guide for future developers (and our future selves) that documents the available CSS variables and the class names required to structure a plugin settings page correctly. This will be essential for porting future plugins efficiently.
