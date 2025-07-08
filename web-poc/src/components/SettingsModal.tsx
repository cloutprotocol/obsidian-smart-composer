import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { AppProvider } from 'src/contexts/app-context';
import { DialogContainerProvider } from 'src/contexts/dialog-container-context';
import { McpProvider } from 'src/contexts/mcp-context';
import { PluginProvider } from 'src/contexts/plugin-context';
import { RAGProvider } from 'src/contexts/rag-context';
import { SettingsProvider } from 'src/contexts/settings-context';
import { SettingsTabRoot } from 'src/components/settings/SettingsTabRoot';
import { app, PluginSettingTab } from '../lib/obsidian-api';
import SmartComposerPlugin from 'src/main';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plugin: SmartComposerPlugin | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  plugin,
}) => {
  const [activeTab, setActiveTab] = useState<PluginSettingTab | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);

  const settingTabs = app.settingTabs;

  // Effect to manage the active tab based on the modal's open state.
  useEffect(() => {
    if (isOpen) {
      // When the modal opens, set the first available tab as active.
      if (settingTabs.length > 0) {
        setActiveTab(settingTabs[0]);
      }
    } else {
      // When the modal closes, clear the active tab. The display effect's
      // cleanup function will then handle hiding the content.
      setActiveTab(null);
    }
  }, [isOpen, settingTabs]);

  // Effect to render the content of the active tab. This is the core
  // of the declarative approach.
  useEffect(() => {
    if (activeTab && contentRef.current && plugin) {
      // Create a new React root if one doesn't exist for the content element.
      if (!rootRef.current) {
        rootRef.current = createRoot(contentRef.current);
      }

      // Render the settings tab content within all the necessary contexts.
      // This is the key change to solve the context availability issue.
      rootRef.current.render(
        <React.StrictMode>
          <AppProvider app={app as any}>
            <PluginProvider plugin={plugin}>
              <SettingsProvider
                settings={plugin.settings}
                setSettings={plugin.setSettings.bind(plugin)}
                addSettingsChangeListener={plugin.addSettingsChangeListener.bind(
                  plugin,
                )}
              >
                <DialogContainerProvider>
                  <RAGProvider>
                    <McpProvider>
                      <SettingsTabRoot
                        app={app as any}
                        plugin={plugin}
                      />
                    </McpProvider>
                  </RAGProvider>
                </DialogContainerProvider>
              </SettingsProvider>
            </PluginProvider>
          </AppProvider>
        </React.StrictMode>,
      );
    }

    // The cleanup function is critical. It runs when `activeTab` changes
    // or when the component unmounts. This is the correct, safe place
    // to unmount the React root, preventing memory leaks.
    return () => {
      rootRef.current?.unmount();
      rootRef.current = null;
    };
  }, [activeTab, plugin]); // This effect now depends on the plugin instance.

  if (!isOpen) {
    return null;
  }

  const handleTabClick = (tab: PluginSettingTab) => {
    // By simply updating the state, we let the useEffect hooks handle the
    // hide/display logic. This is the declarative React way and avoids
    // potential race conditions from manual, imperative calls.
    setActiveTab(tab);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="modal-close-button">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-nav">
            <div className="settings-nav-header">Plugin Settings</div>
            {settingTabs.map((tab) => (
              <div
                key={tab.id}
                className={`modal-nav-item ${
                  activeTab?.id === tab.id ? 'is-active' : ''
                }`}
                onClick={() => handleTabClick(tab)}
              >
                {tab.name}
              </div>
            ))}
          </div>
          <div className="modal-main" ref={contentRef}>
            {/* Content is rendered here by the plugin's display() method */}
          </div>
        </div>
      </div>
    </div>
  );
};
