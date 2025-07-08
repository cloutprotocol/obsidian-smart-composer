/**
 * This is the root component of the application.
 * It orchestrates the main layout, including the `FileTreeView` and `MarkdownEditor`,
 * and manages the application's global state, such as the currently active file.
 */
import React, { useState, useEffect, useRef } from 'react';
import { FileTreeView } from './components/FileTreeView';
import { MarkdownEditor } from './components/MarkdownEditor';
import { SettingsModal } from './components/SettingsModal';
import { app, linkObsidianApiState, Command, Editor, MarkdownView, TFile } from './lib/obsidian-api';
import SmartComposerPlugin from 'src/main';
import { WorkspaceLeaf } from './lib/obsidian-api';

import { AppProvider } from 'src/contexts/app-context';
import { McpProvider } from 'src/contexts/mcp-context';
import { PluginProvider } from 'src/contexts/plugin-context';
import { RAGProvider } from 'src/contexts/rag-context';
import { SettingsProvider } from 'src/contexts/settings-context';
import { DialogContainerProvider } from 'src/contexts/dialog-container-context';

export interface VirtualFile {
  content: string;
  mtime?: number;
}
export type FileSystemState = Record<string, VirtualFile>; // filename -> file object

const App: React.FC = () => {
  const [plugin, setPlugin] = useState<SmartComposerPlugin | null>(null);
  const pluginRef = useRef<SmartComposerPlugin | null>(null);
  const [openLeaves, setOpenLeaves] = useState<WorkspaceLeaf[]>([]);
  const [activeLeaf, setActiveLeaf] = useState<WorkspaceLeaf | null>(null);

  const [fileSystem, setFileSystem] = useState<FileSystemState>({
    'Welcome.md': { content: '# Welcome\n\nThis is a sample file.' },
    'Another-File.md': { content: '# Another File\n\nSome content here.' },
    'folder/Note-In-Folder.md': { content: '# Another File\n\nSome content here.' },
  });
  const fileSystemRef = useRef(fileSystem);
  fileSystemRef.current = fileSystem;

  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isRightSidebarVisible, setRightSidebarVisible] = useState(false);
  const [rightSidebarContent, setRightSidebarContent] = useState<HTMLElement | null>(null);
  const rightSidebarRef = useRef<HTMLDivElement>(null);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

  useEffect(() => {
    linkObsidianApiState(() => fileSystemRef.current, setFileSystem);

    const initPlugin = async () => {
      
      const handleActiveLeafChange = (leaf: WorkspaceLeaf | null) => {
        if (leaf) {
          setOpenLeaves(prevOpenLeaves => {
            // Use functional update to prevent stale state
            if (prevOpenLeaves.find(l => l.id === leaf.id)) {
              return prevOpenLeaves; // If leaf already exists, do nothing
            }
            return [...prevOpenLeaves, leaf]; // Otherwise, add it
          });
        }
        setActiveLeaf(leaf);
      };
      app.workspace.on('active-leaf-change', handleActiveLeafChange);

      const handleLayoutChange = (leaf: WorkspaceLeaf & { view: { containerEl: HTMLElement }}) => {
          const isChatView = leaf.getViewState().type === 'smtcmp-chat-view';
          setRightSidebarVisible(isChatView);
          if (isChatView && leaf.view?.containerEl) {
            setRightSidebarContent(leaf.view.containerEl);
          } else {
            setRightSidebarContent(null);
          }
      };
      app.workspace.on('layout-change', handleLayoutChange);

      const files = app.vault.getFiles();
      if (files.length > 0) {
        app.workspace.openLinkText(files[0].path, '');
      }

      const pluginManifest = {
        id: 'smart-composer',
        name: 'Smart Composer',
        version: '1.0.0',
        minAppVersion: '1.0.0',
        description: 'A smart composer plugin.',
        author: 'POC',
      };
      
      const newPlugin = new SmartComposerPlugin(app as any, pluginManifest as any);
      await newPlugin.onload();
      
      // Re-enable tools to allow for file editing
      newPlugin.settings.chatOptions.enableTools = true;

      pluginRef.current = newPlugin;
      setPlugin(newPlugin);
    };

    initPlugin();

    return () => {
      pluginRef.current?.onunload();
    };
  }, []);

  useEffect(() => {
    if (rightSidebarRef.current) {
      rightSidebarRef.current.innerHTML = '';
      if (rightSidebarContent) {
        rightSidebarRef.current.appendChild(rightSidebarContent);
      }
    }
  }, [rightSidebarContent]);


  const handleFileSelect = (path: string) => {
    app.workspace.openLinkText(path, '');
  };

  const handleCloseTab = (leafToClose: WorkspaceLeaf) => {
    app.workspace.detachLeaf(leafToClose);
    setOpenLeaves(prevLeaves => prevLeaves.filter(l => l !== leafToClose));
  };

  const executeCommand = (command: Command) => {
    if (command.callback) {
      command.callback();
    } else if (command.editorCallback) {
      const view = app.workspace.getActiveViewOfType(MarkdownView);
      if (view) {
        // We need to provide the editor with the *current* content
        // This is a bit of a hack, as the original editor instance
        // won't have the updated content if it was changed by another process (like the AI)
        const activeFileContent = activeLeaf?.view.file ? fileSystem[activeLeaf.view.file.path]?.content : '';
        const mockEditor: Editor = {
          getValue: () => activeFileContent,
          setValue: (content: string) => {
            if (activeLeaf?.view.file) {
              setFileSystem(prevFs => ({
                ...prevFs,
                [activeLeaf.view.file.path]: { ...prevFs[activeLeaf.view.file.path], content },
              }));
            }
          },
          getSelection: () => view.editor.getSelection(),
          replaceSelection: (text: string) => view.editor.replaceSelection(text),
        };
        command.editorCallback(mockEditor, view);
      } else {
        console.warn("Cannot execute editor command: No active MarkdownView found.");
      }
    }
    setShowCommandPalette(false);
  }

  if (!plugin) {
    return <div>Loading Smart Composer...</div>
  }

  return (
    <AppProvider app={app as any}>
      <PluginProvider plugin={plugin}>
        <SettingsProvider
          settings={plugin.settings}
          setSettings={plugin.setSettings.bind(plugin)}
          addSettingsChangeListener={plugin.addSettingsChangeListener.bind(plugin)}
        >
          <DialogContainerProvider>
            <RAGProvider>
              <McpProvider>
                <div className="app-container">
                  <div id="ribbon-bar">
                    <button onClick={() => setShowCommandPalette(!showCommandPalette)} title="Command palette">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 6 4 4-4 4"/><path d="m6 18-4-4 4-4"/><path d="m14.5 4-5 16"/></svg>
                    </button>
                    <button onClick={() => setSettingsModalOpen(true)} title="Settings">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </div>
                  {showCommandPalette && (
                    <div className="command-palette">
                      <ul>
                        {app.getCommands().map((cmd: Command) => (
                          <li key={cmd.id} onClick={() => executeCommand(cmd)}>
                            {cmd.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <SettingsModal
                    plugin={plugin}
                    isOpen={isSettingsModalOpen}
                    onClose={() => setSettingsModalOpen(false)}
                  />
                  <div className="sidebar">
                    <FileTreeView
                      onFileSelect={handleFileSelect}
                    />
                  </div>
                  <div className="main-content">
                    <div className="editor-container">
                      <div className="tab-container">
                        {openLeaves.map(leaf => (
                          <div
                            key={leaf.id}
                            className={`tab-item ${activeLeaf === leaf ? 'is-active' : ''}`}
                            onClick={() => app.workspace.setActiveLeaf(leaf)}
                          >
                            <span>{leaf.view.file.name}</span>
                            <button className="close-tab-button" onClick={(e) => {
                              e.stopPropagation();
                              handleCloseTab(leaf);
                            }}>x</button>
                          </div>
                        ))}
                      </div>
                      <MarkdownEditor
                        activeFile={activeLeaf?.view.file?.path}
                        fileContent={activeLeaf?.view.file ? fileSystem[activeLeaf.view.file.path]?.content : ''}
                        onContentChange={(newContent) => {
                          if (activeLeaf?.view.file) {
                            setFileSystem(prevFs => ({
                              ...prevFs,
                              [activeLeaf.view.file.path]: { ...prevFs[activeLeaf.view.file.path], content: newContent },
                            }));
                          }
                        }}
                      />
                    </div>
                    <div className={`right-sidebar ${isRightSidebarVisible ? 'is-visible' : ''}`} ref={rightSidebarRef}>
                      {/* The ChatView will be activated here by the plugin */}
                    </div>
                  </div>
                </div>
              </McpProvider>
            </RAGProvider>
          </DialogContainerProvider>
        </SettingsProvider>
      </PluginProvider>
    </AppProvider>
  );
};

export default App; 