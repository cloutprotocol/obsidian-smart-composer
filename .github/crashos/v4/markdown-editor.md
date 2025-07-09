# Markdown Editor: Analysis and PRD

This document provides a detailed analysis of the current markdown editor implementation in the `web-poc` and a Product Requirements Document (PRD) for transitioning to a WYSIWYG editing experience.

## 1. Current Implementation Analysis

The current markdown editor is implemented in the `web-poc/src/components/MarkdownEditor.tsx` component.

*   **Core Technology:** It utilizes the `@uiw/react-markdown-editor` library, which is a React wrapper around the **CodeMirror 6** text editor. CodeMirror is a powerful, modern, and highly extensible toolkit for building code and text editors.
*   **Functionality:**
    *   It's a standard React component that receives file content via props and uses an `onChange` callback to sync changes.
    *   It supports dynamic theming (dark/light modes), which is implemented correctly using CodeMirror's theming system.
    *   It leverages CodeMirror's extension system, as seen with the implementation of `EditorView.lineWrapping` for word wrap toggling.
*   **Data Flow:** The `activeFile` and `fileContent` are passed down as props. When the user types, the `handleContentChange` function is called, which updates the parent component's state. This is a standard and effective way to manage editor state in React.

## 2. Best Practices and Potential Issues

*   **Strengths:**
    *   **Solid Foundation:** Using CodeMirror 6 is an excellent choice. It's a mature, well-maintained, and performant library.
    *   **Clean Component:** The `MarkdownEditor.tsx` component is simple, readable, and follows modern React practices.
    *   **Extensible:** The use of CodeMirror's extension system for theming and line wrapping demonstrates that the foundation is in place for further extension.
*   **Potential Issues & Bad Practices:**
    *   **Wrapper Abstraction:** While convenient, the `@uiw/react-markdown-editor` library adds a layer of abstraction over the core CodeMirror instance. This could potentially limit access to the full power of the CodeMirror API if we need to implement highly custom or complex features that the wrapper doesn't expose directly. This is not a "bad practice" per se, but a trade-off to be aware of.
    *   **No identifiable bad practices** were found in the current implementation. The code is clean and functional.

## 3. Extensibility

The editor's extensibility is high, thanks to its CodeMirror foundation. We can add a wide array of features by writing or integrating CodeMirror 6 extensions. This could include:
*   Advanced syntax highlighting
*   Linting and validation
*   Collaborative editing features
*   Custom keymaps and commands

However, its extensibility is geared towards features for a **code editor**, not a WYSIWYG editor.

---

## 4. PRD: Default WYSIWYG Editing Experience

The following section outlines the requirements and implementation analysis for a new editing experience.

**User Story:**
As a user, I want to see my notes rendered as beautiful, clean documents by default, and be able to edit them directly in that rendered view, so that I can focus on the content without being distracted by markdown syntax. I also want the ability to switch to a raw markdown source view when I need more granular control.

**Requirements:**
1.  By default, the main editor view should display the rendered markdown content.
2.  The rendered view should be fully editable (WYSIWYG - What You See Is What You Get).
3.  The entire editor pane should be the WYSIWYG view (no split-screen).
4.  A button/toggle should be available to switch to a raw, code-based markdown editor view.
5.  Applying edits from the AI Chat should modify the underlying markdown source, and the changes should be reflected in the WYSIWYG view.

### Feasibility Analysis & Proposed Solutions

The core challenge is that the current component is a **code editor**, and the user is asking for a **WYSIWYG editor**. These are fundamentally different types of editors. We have two paths forward:

#### Approach 1: Enhance the Existing CodeMirror Editor

We could attempt to create a "pseudo-WYSIWYG" experience on top of CodeMirror.

*   **Argument for this approach:** This path offers the least disruption to our current architecture. We would continue to use CodeMirror, leveraging its powerful decoration and view plugin APIs to *simulate* a rendered view. For example, we could write extensions that find markdown syntax like `## Header` and style the text to be large and bold while hiding the `##` characters. The underlying document remains pure markdown, which is a significant advantage for portability and interoperability. Integrating with the AI chat's "apply" feature would be straightforward, as it would continue to operate on the plain text source.

*   **Argument against this approach:** This is a path fraught with complexity and peril. We would essentially be re-implementing a WYSIWYG editor from scratch on a platform not designed for it. The number of edge cases is enormous: How does a user edit a link URL? How is selection handled across differently styled blocks? How do we present a toolbar to apply formatting? While theoretically possible, the result would likely be a brittle, buggy, and ultimately frustrating user experience that falls short of a true WYSIWYG editor. The development effort required would be immense.

#### Approach 2: Integrate a Dedicated WYSIWYG Editor Library

We could replace the markdown editor with a library purpose-built for WYSIWYG editing.

*   **Argument for this approach:** This is the robust, professional solution. Libraries like **Tiptap** (based on ProseMirror) or **Lexical** (from Meta) are architected specifically for creating rich text editing experiences like Notion or Google Docs. They provide a structured document model (often a JSON schema) which makes complex operations like embedding, collaborative editing, and rich styling far more reliable. This approach delivers a superior user experience and a more stable and maintainable codebase in the long run. To switch to a "code" view, we would convert the editor's content to markdown and display it in our existing `MarkdownEditor` component.

*   **Argument against this approach:** This represents a more significant initial effort. It requires introducing a major new dependency and rewriting the editor component. The most complex piece of this work is managing the conversion between the WYSIWYG editor's native format (e.g., HTML or a JSON object) and plain markdown. This conversion process can be tricky and potentially "lossy" if the WYSIWYG content has features that can't be represented in standard markdown.

### Conclusion and Recommendation

**Approach 2 is the clearly superior solution.**

While enhancing CodeMirror (Approach 1) is tempting, it is a classic "penny wise, pound foolish" scenario. The long-term cost of building and maintaining a custom, fragile WYSIWYG layer would far outweigh the short-term cost of integrating a proper library. To deliver the high-quality experience the user desires, we must use the right tool for the job.

**Recommendation:** Integrate the **Tiptap** editor. It is highly extensible, well-documented, and its community is strong. It is built on ProseMirror, which is the same foundation used by tools like the New York Times' editor, and is perfect for this kind of application.

### Diagnostic Steps / Proposed Next Actions

To validate this approach, the following proof-of-concept should be developed:

1.  **Create a new branch:** `feature/wysiwyg-poc`
2.  **Install dependencies:** `npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link markdown-it turndown`
3.  **Create a new `WysiwygEditor.tsx` component.**
4.  **Implement a `useTiptap` hook** inside the new component, configured with the `StarterKit` and other desired extensions.
5.  **Manage content conversion:**
    *   On component mount, use `markdown-it` to convert the incoming markdown `fileContent` prop into HTML.
    *   Load this HTML into the Tiptap editor instance.
    *   On every Tiptap `update`, get the new content as HTML, use `turndown` to convert it back to markdown, and call the `onContentChange` prop with the result.
6.  **Add a view toggle** in `App.tsx` that conditionally renders either the existing `MarkdownEditor` or the new `WysiwygEditor`, allowing for a direct comparison.
