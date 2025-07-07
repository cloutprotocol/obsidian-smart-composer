/**
 * This component provides a rich markdown editor for creating and editing notes.
 * It uses the `@uiw/react-markdown-editor` library to provide a full-featured
 * editing experience with syntax highlighting and a live preview.
 */
import React, { useState, useEffect } from 'react';
import { app } from '../lib/obsidian-api';
import Markdown from "@uiw/react-markdown-editor";

interface MarkdownEditorProps {
  activeFile: string | null;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ activeFile }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (activeFile) {
      app.vault.read(activeFile).then(setContent);
    } else {
      setContent('');
    }
  }, [activeFile]);

  const handleContentChange = (value: string) => {
    setContent(value);
    if (activeFile) {
      app.vault.write(activeFile, value);
    }
  };

  if (!activeFile) {
    return <div className="editor-container">Select a file to start editing.</div>;
  }

  return (
    <div className="editor-container">
      <h3>{activeFile}</h3>
      <Markdown
        value={content}
        onChange={handleContentChange}
        height="calc(100vh - 80px)"
        style={{
          border: '1px solid #444',
          borderRadius: '4px',
        }}
        />
    </div>
  );
}; 