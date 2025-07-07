/**
 * This is the root component of the application.
 * It orchestrates the main layout, including the `FileTreeView` and `MarkdownEditor`,
 * and manages the application's global state, such as the currently active file.
 */
import React, { useState, useEffect } from 'react';
import { FileTreeView } from './components/FileTreeView';
import { MarkdownEditor } from './components/MarkdownEditor';
import { app } from './lib/obsidian-api';

const App: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  
  useEffect(() => {
      const handleFileOpen = (file: { path: string } | null) => {
          if (file) {
              setActiveFile(file.path);
          }
      }
      app.workspace.on('file-open', handleFileOpen)
      
      // Open the first file on load
      const files = app.vault.getFiles();
      if (files.length > 0) {
        app.workspace.openLinkText(files[0].path, '');
      }

      return () => {
          app.workspace.off('file-open', handleFileOpen);
      }
  }, []);


  const handleFileSelect = (path: string) => {
    app.workspace.openLinkText(path, '');
  };

  return (
    <div className="app-container">
      <FileTreeView onFileSelect={handleFileSelect} />
      <MarkdownEditor activeFile={activeFile} />
    </div>
  );
};

export default App; 