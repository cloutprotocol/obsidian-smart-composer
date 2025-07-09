/**
 * This component provides a rich markdown editor for creating and editing notes.
 * It uses the `@uiw/react-markdown-editor` library to provide a full-featured
 * editing experience with syntax highlighting and a live preview.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { app } from '../lib/obsidian-api';
import Markdown from "@uiw/react-markdown-editor";
import { EditorView } from "@codemirror/view";
import { useTheme } from '../contexts/theme-context';
import { smartComposerDark, smartComposerLight } from '../lib/editor-theme';

interface MarkdownEditorProps {
  activeFile: string | null;
  fileContent: string;
  onContentChange: (newContent: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ activeFile, fileContent, onContentChange }) => {
  const [content, setContent] = useState(fileContent);
  const { theme } = useTheme();

  useEffect(() => {
    setContent(fileContent);
  }, [fileContent]);
  
  const handleContentChange = (value: string) => {
    setContent(value);

    if (onContentChange) {
      onContentChange(value);
    }
  };

  const editorTheme = useMemo(() => {
    return theme === 'dark' ? smartComposerDark : smartComposerLight;
  }, [theme]);

  const [wordWrap, setWordWrap] = useState(true);

  // This memoized value provides the necessary CodeMirror extension to enable/disable line wrapping.
  // Using the editor's native API is more robust than CSS overrides.
  const extensions = useMemo(() => {
    if (wordWrap) {
      return [EditorView.lineWrapping];
    }
    return [];
  }, [wordWrap]);

  if (!activeFile) {
    return <div className="editor-container">Select a file to start editing.</div>;
  }

  return (
    <div className="editor-container">
      <Markdown
        value={content}
        onChange={handleContentChange}
        height="calc(100vh - 40px)"
        extensions={extensions}
        theme={editorTheme}
        autoFocus={false}
        />
    </div>
  );
}; 