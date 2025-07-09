# PRD: Revamp "No File Open" View

## 1. Overview

The goal is to improve the initial user experience of the web-based proof-of-concept by replacing the spartan "No file is open" message with a more interactive and helpful screen, inspired by the native Obsidian experience.

## 2. Problem

Currently, when no file is open, the user sees a simple text message:

> No file is open.
> Select a file from the list to get started.

This is not very engaging and doesn't guide the user on what actions they can take next. It relies on the user noticing the file tree view on the left.

## 3. Proposed Solution

We will replace the current static text with a new view that includes:
- A clear "No file is open" title.
- A set of action links/buttons to guide the user.

### 3.1. UI Components

The new view will contain the following elements, styled to match the look and feel of the provided screenshot:

1.  **Title**: "No file is open"
2.  **Action: Create new file**: A button that prompts the user for a new file name and creates it.
3.  **Action: Open file**: A button that opens the command palette, allowing the user to search for and open existing files or execute other commands.
4.  **Action: Open Welcome Note**: A button that directly opens the `welcome.md` file.

### 3.2. Functional Requirements

- **Create New File**:
    - On click, a prompt should appear asking for a file name.
    - The file should be created with a default title based on the file name.
    - The new file should be added to the file system state.
    - The new file should be opened in a new tab and set as the active leaf.
- **Open File**:
    - On click, the command palette should become visible.
- **Open Welcome Note**:
    - On click, the `welcome.md` file should be opened in a new tab and set as the active leaf.

## 4. Design Philosophy

This change follows our philosophy of porting the Obsidian experience with high fidelity while making minimal, non-intrusive changes. The actions provided are core to the note-taking experience and mirror functionality available in Obsidian. The implementation will leverage the existing mock `Workspace` and `Vault` APIs where possible, extending them as needed in a way that is consistent with the real Obsidian API.
