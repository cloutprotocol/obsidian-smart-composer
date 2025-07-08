import React, { useState, useRef, useEffect } from 'react';
import { app, PluginSettingTab } from '../lib/obsidian-api';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<PluginSettingTab | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const settingTabs = app.settingTabs;

  useEffect(() => {
    if (isOpen && settingTabs.length > 0 && !activeTab) {
      setActiveTab(settingTabs[0]);
    }
    // When the modal is closed, reset the active tab so that it's re-initialized
    // on the next open. This prevents a blank page from showing on second open.
    if (!isOpen) {
      setActiveTab(null);
    }
  }, [isOpen, settingTabs, activeTab]);

  useEffect(() => {
    if (activeTab && contentRef.current) {
      // Clear previous content
      contentRef.current.innerHTML = '';

      // Assign the container and then call display
      activeTab.containerEl = contentRef.current;
      activeTab.display();
    }

    return () => {
      // Clean up when the component unmounts or the tab changes
      activeTab?.hide();
    };
  }, [activeTab]);

  if (!isOpen) {
    return null;
  }

  const handleTabClick = (tab: PluginSettingTab) => {
    activeTab?.hide(); // Hide the old tab content
    setActiveTab(tab);
  };

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div className="settings-modal-content" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="settings-modal-close-button">&times;</button>
        </div>
        <div className="settings-modal-body">
          <div className="settings-nav">
            <div className="settings-nav-header">Plugin Settings</div>
            {/* // The key was changed from `tab.id` to a composite key. // This is because React's StrictMode can cause the settings tabs // to be registered twice during development, leading to a crash // due to duplicate keys. While the root cause was fixed by // cleaning up tabs in `App.tsx`, this composite key is more // robust, ensuring uniqueness even if a single plugin were to // register multiple tabs (as long as their names are unique).
Smart Composer */}
            {settingTabs.map(tab => (
              <div
                key={tab.id}
                className={`settings-nav-item ${activeTab?.id === tab.id ? 'active' : ''}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab.name}
              </div>
            ))}
          </div>
          <div className="settings-content" ref={contentRef}>
            {/* Content is rendered here by the plugin's display() method */}
          </div>
        </div>
      </div>
    </div>
  );
}; 