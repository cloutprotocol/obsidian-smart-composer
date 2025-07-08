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
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ activeFile }) => {
  const [content, setContent] = useState('');
  const [wordWrap, setWordWrap] = useState(false);

  // This memoized value provides the necessary CodeMirror extension to enable/disable line wrapping.
  // Using the editor's native API is more robust than CSS overrides.
  const extensions = useMemo(() => {
    if (wordWrap) {
      return [EditorView.lineWrapping];
    }
    return [];
  }, [wordWrap]);

  useEffect(() => {
    // This effect now safely handles file loading.
    // It will only attempt to read a file if `activeFile` is a valid path string.
    if (activeFile) {
      const file = app.vault.getFileByPath(activeFile);
      // It further ensures that the file object exists before trying to read.
      if (file) {
        app.vault.read(file).then(setContent);
      } else {
        // If the file can't be found (e.g., it was deleted), clear the content.
        setContent('');
      }
    } else {
      setContent('');
    }
  }, [activeFile]);

  const handleContentChange = (value: string) => {
    setContent(value);
    if (activeFile) {
      // Like reading, writing is also protected by getting the TFile object first.
      const file = app.vault.getFileByPath(activeFile);
      if (file) {
        app.vault.write(file, value);
      }
    }
  };

  if (!activeFile) {
    return <div className="editor-container">Select a file to start editing.</div>;
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h3>{activeFile}</h3>
        <div className="toggle-container">
          <span>wrap</span>
          {/* This label wraps a hidden checkbox and a span to create the custom toggle switch */}
          <label className="toggle-switch">
            <input type="checkbox" checked={wordWrap} onChange={() => setWordWrap(!wordWrap)} />
            <span className="slider"></span>
          </label>
        </div>
      </div>
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