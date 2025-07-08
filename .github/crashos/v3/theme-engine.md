# PRD: Universal Theme Engine

## 1. Introduction

The Smart Composer web application currently features a hardcoded dark theme. While functional, this lacks the flexibility to cater to user preferences for different visual styles, such as a light theme, which is often preferred for readability in bright environments. To improve user experience and accessibility, we need to implement a universal theme engine that allows users to switch between different visual themes dynamically.

## 2. Problem Statement

The absence of a theming system limits user customization and can impact usability for those who find dark themes difficult to read. All color values are currently defined for a single dark mode, making it cumbersome and error-prone to introduce new visual styles. We need a centralized and scalable system for managing UI colors.

## 3. Goals & Objectives

- **Goal:** To create a flexible, CSS variable-driven theme engine.
- **Objective 1:** Refactor all existing color definitions to use a centralized set of semantic theme variables.
- **Objective 2:** Implement a "Light" theme as the first alternative to the current "Dark" theme.
- **Objective 3:** Provide a mechanism for the user to switch between themes from the application's settings.
- **Objective 4:** Ensure the selected theme persists across user sessions.
- **Objective 5:** The system should be easily extensible for future themes.

## 4. Functional Requirements

- **FR1: Theme Definition:**
  - Themes will be defined as a set of CSS variables.
  - A base set of semantic color variables will be established (e.g., `--color-background-primary`, `--color-text-normal`, `--color-interactive-accent`).
  - All UI components must reference these semantic variables for their colors. Hardcoded color values should be eliminated from the component styles.
- **FR2: Theme Switching:**
  - A theme toggle/selector will be added to the application's settings UI.
  - Switching the theme will dynamically update the application's appearance without requiring a page reload.
- **FR3: Theme Persistence:**
  - The user's selected theme will be saved to local storage to persist across browser sessions.
- **FR4: Default Themes:**
  - The initial implementation will include two themes:
    - **Dark (Default):** The existing application theme.
    - **Light:** A new theme with a light color palette, designed for high contrast and readability.

## 5. Technical Implementation Plan

- **Phase 1: Variable Scoping & Refactoring**
  1.  Introduce a class-based approach for themes. A class (e.g., `theme-dark`, `theme-light`) will be applied to the `<body>` or root element.
  2.  Define the CSS color variables for each theme within their respective class scopes. For example:
      ```css
      :root.theme-dark {
        --color-background-primary: #202020;
        --color-text-normal: #dcddde;
        /* ... all other dark theme variables */
      }
      :root.theme-light {
        --color-background-primary: #ffffff;
        --color-text-normal: #202020;
        /* ... all other light theme variables */
      }
      ```
  3.  Audit the entire `style.css` file and all component styles to replace existing color variables (e.g., `--background-primary`) with the new semantic variables (e.g., `var(--color-background-primary)`).
- **Phase 2: Theme Management**
  1.  Create a `ThemeContext` in React to manage the application's current theme.
  2.  The context provider will read the saved theme from local storage on initial load, apply the corresponding class to the `<body>`, and provide a function to update the theme.
  3.  The theme-switching component in the settings will use this context to change the theme.

## 6. Success Metrics

- The application successfully supports both a light and dark theme.
- Users can switch between themes, and their preference is saved.
- All hardcoded color values have been removed from the CSS in favor of theme variables.
- The new system is documented and easy for developers to use when building new components. 