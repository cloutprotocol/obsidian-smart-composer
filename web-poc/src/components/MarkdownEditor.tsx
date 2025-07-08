/**
 * This component provides a rich markdown editor for creating and editing notes.
 * It uses the `@uiw/react-markdown-editor` library to provide a full-featured
 * editing experience with syntax highlighting and a live preview.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { app } from '../lib/obsidian-api';
import Markdown from "@uiw/react-markdown-editor";
import { EditorView } from "@codemirror/view";

interface MarkdownEditorProps {
  activeFile: string | null;
  fileContent: string;
  onContentChange: (newContent: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ activeFile, fileContent, onContentChange }) => {
  const [content, setContent] = useState(fileContent);

  useEffect(() => {
    setContent(fileContent);
  }, [fileContent]);
  
  const handleContentChange = (value: string) => {
    setContent(value);

    if (onContentChange) {
      onContentChange(value);
    }
  };

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
        height="calc(100vh - 120px)"
        extensions={extensions}
        style={{
          border: '1px solid #444',
          borderRadius: '4px',
        }}
        />
    </div>
  );
}; 