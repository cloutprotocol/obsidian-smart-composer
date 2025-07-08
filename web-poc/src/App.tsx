/**
 * This is the root component of the application.
 * It orchestrates the main layout, including the `FileTreeView` and `MarkdownEditor`,
 * and manages the application's global state, such as the currently active file.
 */
import React, { useState, useEffect } from 'react';
import { FileTreeView } from './components/FileTreeView';
import { MarkdownEditor } from './components/MarkdownEditor';
import { app } from './lib/obsidian-api';
import SmartComposerPlugin from 'src/main';
import { WorkspaceLeaf } from './lib/obsidian-api';

const App: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isRightSidebarVisible, setRightSidebarVisible] = useState(false);

  useEffect(() => {
    const handleFileOpen = (file: { path: string } | null) => {
      if (file) {
        setActiveFile(file.path);
      }
    };
    app.workspace.on('file-open', handleFileOpen);

    const handleLayoutChange = (leaf: WorkspaceLeaf) => {
        // Show the sidebar if the active leaf is meant for the right sidebar.
        const isChatView = leaf.getViewState().type === 'smtcmp-chat-view';
        setRightSidebarVisible(isChatView);
    };
    app.workspace.on('active-leaf-change', handleLayoutChange);

    // Open the first file on load
    const files = app.vault.getFiles();
    if (files.length > 0) {
      app.workspace.openLinkText(files[0].path, '');
    }

    // --- Plugin Loader ---
    // This is a simplified plugin loader for the POC.
    const pluginManifest = {
      id: 'smart-composer',
      name: 'Smart Composer',
      version: '1.0.0',
      minAppVersion: '1.0.0',
      description: 'A smart composer plugin.',
      author: 'POC',
    };
    // Cast to `any` to satisfy the constructor's type requirement in this mock environment
    const plugin = new SmartComposerPlugin(app as any, pluginManifest as any);
    plugin.onload();
    // --- End Plugin Loader ---

    return () => {
        app.workspace.off('file-open', handleFileOpen);
        app.workspace.off('active-leaf-change', handleLayoutChange);
    }
  }, []);


  const handleFileSelect = (path: string) => {
    app.workspace.openLinkText(path, '');
  };

  const executeCommand = (command: any) => {
    if (command.callback) {
      command.callback();
    } else if (command.editorCallback) {
      const view = app.workspace.getActiveViewOfType('MarkdownView');
      if (view) {
        command.editorCallback(view.editor, view);
      } else {
        console.warn("Cannot execute editor command: No active MarkdownView found.");
      }
    }
    setShowCommandPalette(false);
  }

  return (
    <div className="app-container">
      <div id="ribbon-bar">
        <button onClick={() => setShowCommandPalette(!showCommandPalette)}>
          Cmds
        </button>
      </div>
      {showCommandPalette && (
        <div className="command-palette">
          <ul>
            {app.getCommands().map((cmd) => (
              <li key={cmd.id} onClick={() => executeCommand(cmd)}>
                {cmd.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="sidebar">
        <FileTreeView onFileSelect={handleFileSelect} />
      </div>
      <div className="main-content">
        <div className="editor-container">
          <MarkdownEditor activeFile={activeFile} />
        </div>
        <div className={`right-sidebar ${isRightSidebarVisible ? 'is-visible' : ''}`}>
          {/* The ChatView will be activated here by the plugin */}
        </div>
      </div>
    </div>
  );
};

export default App; 