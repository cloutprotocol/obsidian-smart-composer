import React, { useState, useEffect } from 'react';
import { app } from '../lib/obsidian-api';
import './SettingsModal.css';
import { PluginSettingTab } from '../lib/obsidian-api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<PluginSettingTab | null>(null);

  useEffect(() => {
    // When the modal is opened, if there's no active tab, set the first one.
    if (isOpen && !activeTab && app.settingTabs.length > 0) {
      setActiveTab(app.settingTabs[0]);
    }
    // Reset active tab when modal is closed to ensure it's fresh on reopen
    if (!isOpen) {
        setActiveTab(null);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) {
    return null;
  }

  const handleTabClick = (tab: PluginSettingTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="modal-close-button">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <nav className="modal-nav">
            <div className="settings-nav-header">Plugins</div>
            {app.settingTabs.map((tab) => (
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
          </nav>
          <div className="modal-main">
            {activeTab && <SettingsContent tab={activeTab} />}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SettingsContentProps {
  tab: PluginSettingTab;
}

const SettingsContent: React.FC<SettingsContentProps> = ({ tab }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (tab && contentRef.current) {
      const container = contentRef.current;
      // Assign the container, then call display()
      tab.containerEl = container;
      tab.display();

      // Return a cleanup function to call hide().
      // The hide() method is solely responsible for cleanup.
      // The previous manual DOM clearing was causing the flashing.
      return () => {
        tab.hide();
      };
    }
  }, [tab]); // Rerun effect when the tab changes

  return <div ref={contentRef} />;
}; 