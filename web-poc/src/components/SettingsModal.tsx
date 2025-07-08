import React, { useState, useRef, useEffect } from 'react';
import { app, PluginSettingTab } from '../lib/obsidian-api';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<PluginSettingTab | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
    if (activeTab && contentRef.current) {
      // Clear previous content to ensure a clean state for the new tab.
      contentRef.current.innerHTML = '';

      // The plugin's setting tab expects its `containerEl` to be set before
      // `display()` is called.
      activeTab.containerEl = contentRef.current;
      activeTab.display();
    }

    // The cleanup function is critical. It runs when `activeTab` changes
    // or when the component unmounts. This is the correct, safe place
    // to hide the previous tab's content.
    return () => {
      activeTab?.hide();
    };
  }, [activeTab]); // This effect depends *only* on the active tab.

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
