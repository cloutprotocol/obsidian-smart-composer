# PRD: Debugging and Restoring Plugin Styling

## 1. Problem Statement

The plugin's user interface is rendering without its intended custom styles within the Obsidian environment. This results in a poor, un-themed user experience and indicates a fundamental failure in the CSS loading or application pipeline. The immediate goal is to diagnose the root cause and restore the intended styling.

## 2. Potential Root Causes

Several potential issues could be preventing the styles from being applied correctly. A systematic check is required to isolate the problem.

1.  **Manifest Misconfiguration**: The `manifest.json` file is responsible for informing Obsidian about the plugin's components, including its stylesheet. If the `css` key is missing or points to the wrong file, the styles will not be loaded.
2.  **Build Process Failure**: The project's build script (`esbuild.config.mjs`) must be configured to copy the `styles.css` file into the final distribution folder. If this step is missing, the file won't be available for Obsidian to load.
3.  **CSS Specificity & Naming Mismatch**: There could be a discrepancy between the CSS selectors defined in `styles.css` and the `className` attributes used in the React components. Alternatively, the plugin's styles might be overridden by more specific selectors from Obsidian's core theme or another active plugin.
4.  **Obsidian Cache Issues**: Obsidian can sometimes cache plugin files. A stale version of the plugin without the correct styling or manifest entry might be served, even after an update.
5.  **Component Rendering Target**: The root of the React application must be rendered into a container element that has the appropriate parent classes, allowing CSS cascade rules to apply as expected.

## 3. Debugging and Resolution Plan

The following steps provide a structured approach to diagnose and resolve the styling issue.

### Step 1: Verify `manifest.json`

- **Action**: Open the `manifest.json` file at the root of the project.
- **Check**: Confirm that the file contains the following exact key-value pair:
  ```json
  "css": "styles.css"
  ```
- **Rationale**: This is the most critical and common failure point. Without this entry, Obsidian is completely unaware of the stylesheet's existence.

### Step 2: Inspect the Build Output Directory

- **Action**: Navigate to the plugin's installation directory within your Obsidian vault (e.g., `<YourVault>/.obsidian/plugins/obsidian-smart-composer/`).
- **Check**: Verify that the `styles.css` file is present in this directory, alongside `main.js` and `manifest.json`.
- **Rationale**: If the file is not here, it means the build process is not copying it correctly. The `esbuild.config.mjs` file would need to be updated to include `styles.css` in its output.

### Step 3: Use Obsidian's Developer Tools to Check for Loaded Styles

- **Action**: Open Obsidian's Developer Tools by pressing `Cmd+Option+I` (macOS) or `Ctrl+Shift+I` (Windows/Linux).
- **Check**: Go to the "Elements" tab. Expand the `<head>` element of the DOM and search for a `<style>` tag with an `id` attribute like `plugin-obsidian-smart-composer`. The content of this tag should be the CSS from `styles.css`.
- **Rationale**: This provides definitive proof of whether Obsidian has found and loaded the CSS file into the application.

### Step 4: Inspect Component Elements for Applied Rules

- **Action**: With the Developer Tools still open, use the element inspector (the icon of a mouse cursor in a box) to select elements within the plugin's UI.
- **Check**: In the "Styles" panel, look for the CSS rules from `styles.css` being applied to the selected element. Check for any styles that are struck through, as this indicates they have been overridden by a more specific selector.
- **Rationale**: This helps diagnose issues with CSS specificity, class name mismatches, or style conflicts with other themes or plugins.

### Step 5: Force a Hard Reload of Obsidian

- **Action**: Open the command palette (`Cmd+P` or `Ctrl+P`).
- **Check**: Type "Reload app without saving" and execute the command.
- **Rationale**: This clears any potential cache that Obsidian might be holding onto and ensures the latest version of all plugin files is loaded.
