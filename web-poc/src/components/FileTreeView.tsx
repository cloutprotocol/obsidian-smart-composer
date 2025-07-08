/**
 * This component renders the file and folder structure of the vault.
 * It interacts with the `Vault` API to display the file list,
 * handles file creation, and runs the API test suite.
 */
import React, { useState, useEffect } from 'react';
import { app, TFile, TFolder } from '../lib/obsidian-api';

interface FileTreeViewProps {
  onFileSelect: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
}

const convertToTreeNode = (item: TFile | TFolder): TreeNode => {
  const isFolder = item instanceof TFolder;
  const children = isFolder
    ? (item as TFolder).children
        .map(convertToTreeNode)
        .sort((a, b) => {
          if (a.isFolder !== b.isFolder) {
            return a.isFolder ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        })
    : [];

  return {
    name: item.name,
    path: item.path,
    isFolder,
    children,
  };
};

const Node: React.FC<{ node: TreeNode; onFileSelect: (path: string) => void }> = ({ node, onFileSelect }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!node.isFolder) {
    return (
      <div className="file-tree-node is-file" onClick={() => onFileSelect(node.path)}>
        {node.name}
      </div>
    );
  }

  return (
    <div className="file-tree-node is-folder">
      <div className="folder-title" onClick={() => setIsOpen(!isOpen)}>
        <span>{isOpen ? '▼' : '►'}</span> {node.name}
      </div>
      {isOpen && (
        <div className="folder-content">
          {node.children.map(child => (
            <Node key={child.path} node={child} onFileSelect={onFileSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTreeView: React.FC<FileTreeViewProps> = ({ onFileSelect }) => {
  const [tree, setTree] = useState<TreeNode[]>([]);

  const updateTree = () => {
    const root = app.vault.getAllFolders().find(f => f.isRoot());
    if (root) {
      const newTree = root.children
        .map(convertToTreeNode)
        .sort((a, b) => {
            if (a.isFolder !== b.isFolder) {
              return a.isFolder ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
      setTree(newTree);
    }
  };

  useEffect(() => {
    updateTree();
    // In a real scenario, the vault would emit 'changed' events on create, delete, rename
    // For now, we manually listen to the events we know exist in the mock.
    app.vault.on('create', updateTree);
    app.vault.on('delete', updateTree);

    return () => {
      app.vault.off('create', updateTree);
      app.vault.off('delete', updateTree);
    };
  }, []);

  const handleAddFile = () => {
    const fileName = prompt('Enter file name (e.g., new-note.md or folder/new-note.md):');
    if (fileName) {
      const fileExists = app.vault.getFiles().some(f => f.path === fileName);
      if (fileExists) {
        alert(`A file named "${fileName}" already exists.`);
        return;
      }
      app.vault.create(fileName, `# ${fileName.split('/').pop()}\n\n`);
    }
  };

  return (
    <div className="file-tree-container">
      <h2>Vault</h2>
      <div className="actions">
        <button onClick={handleAddFile}>Add File</button>
      </div>
      <div className="tree-view">
        {tree.map(node => (
          <Node key={node.path} node={node} onFileSelect={onFileSelect} />
        ))}
      </div>
    </div>
  );
}; 