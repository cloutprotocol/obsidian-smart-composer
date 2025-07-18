/**
 * This is the root component of the application.
 * It orchestrates the main layout, including the `FileTreeView` and `MarkdownEditor`,
 * and manages the application's global state, such as the currently active file.
 */
import React, { useState, useEffect } from 'react';
import { FileTreeView } from './components/FileTreeView';
import { MarkdownEditor } from './components/MarkdownEditor';
import { SettingsModal } from './components/SettingsModal';
import { app } from './lib/obsidian-api';
import { WorkspaceLeaf } from './lib/obsidian-api';

const App: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isRightSidebarVisible, setRightSidebarVisible] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

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

    if (import.meta.env.DEV) {
      // --- Dev-Only Plugin Loader ---
      // This ensures the plugin's onload/onunload logic runs for local dev,
      // but is excluded from the production build to avoid errors.
      import('../../src/main').then(({ default: SmartComposerPlugin }) => {
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

        // Set up cleanup for when the component unmounts
        app.plugin = plugin;
      });
    }

    // Clean up on unmount
    return () => {
      if (app.plugin) {
        app.plugin.onunload();
      }
      app.workspace.off('file-open', handleFileOpen);
      app.workspace.off('active-leaf-change', handleLayoutChange);
    };
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
        <button onClick={() => setShowCommandPalette(!showCommandPalette)} title="Command palette">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 6 4 4-4 4"/><path d="m6 18-4-4 4-4"/><path d="m14.5 4-5 16"/></svg>
        </button>
        <button onClick={() => setSettingsModalOpen(true)} title="Settings">
          <svg xmlns="http://www.w.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
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
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setSettingsModalOpen(false)} 
      />
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