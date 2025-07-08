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
import { useTheme } from '../contexts/theme-context';

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
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const { theme, toggleTheme } = useTheme();

  const settingTabs = app.settingTabs;

  // Effect to manage the active tab based on the modal's open state.
  useEffect(() => {
    if (isOpen) {
      // When the modal opens, set 'appearance' as the active tab.
      setActiveTabId('appearance');
    } else {
      // When the modal closes, clear the active tab.
      setActiveTabId(null);
    }
  }, [isOpen]);

  // Effect to render the content of the active tab.
  useEffect(() => {
    // If the active tab is not 'appearance' or there's no plugin, render the plugin's settings
    if (activeTabId && activeTabId !== 'appearance' && contentRef.current && plugin) {
      if (!rootRef.current) {
        rootRef.current = createRoot(contentRef.current);
      }

      // Find the actual plugin setting tab to render
      const activePluginTab = settingTabs.find(t => t.id === activeTabId);
      if (!activePluginTab) return;

      // This is a bit of a hack to make the original settings tab work
      // by setting it as the "active" one for the root component to pick up.
      app.setting.activeTab = activePluginTab;

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
  }, [activeTabId, plugin, settingTabs]);

  if (!isOpen) {
    return null;
  }

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
  };

  const isPluginTabActive = activeTabId && activeTabId !== 'appearance';

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
            <div className="settings-nav-header">Appearance</div>
            <div
              className={`modal-nav-item ${
                activeTabId === 'appearance' ? 'is-active' : ''
              }`}
              onClick={() => handleTabClick('appearance')}
            >
              Theme
            </div>
            <div className="settings-nav-header">Plugin Settings</div>
            {settingTabs.map((tab) => (
              <div
                key={tab.id}
                className={`modal-nav-item ${
                  activeTabId === tab.id ? 'is-active' : ''
                }`}
                onClick={() => handleTabClick(tab.id)}
              >
                {tab.name}
              </div>
            ))}
          </div>
          <div className="modal-main">
            {activeTabId === 'appearance' ? (
              <div className="settings-tab-content">
                <h3>Theme</h3>
                <div className="setting-item">
                  <div className="setting-item-info">
                    <div className="setting-item-name">Appearance</div>
                    <div className="setting-item-description">
                      Switch between light and dark mode.
                    </div>
                  </div>
                  <div className="setting-item-control">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={theme === 'dark'}
                        onChange={toggleTheme}
                      />
                      <div className="slider"></div>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div ref={contentRef} style={{ display: isPluginTabActive ? 'block' : 'none' }}>
                {/* Plugin settings content is rendered here by the effect */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
