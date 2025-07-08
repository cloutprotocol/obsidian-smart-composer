/**
 * This component renders the file and folder structure of the vault.
 * It interacts with the `Vault` API to display the file list,
 * handles file creation, and runs the API test suite.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Tree, NodeApi } from 'react-arborist';
import { FaFileMedical, FaFolderPlus } from 'react-icons/fa';
import { app, TFile, TFolder } from '../lib/obsidian-api';

interface FileTreeViewProps {
  onFileSelect: (path: string) => void;
}

// react-arborist compatible node data structure
interface ArboristNode {
  id: string; // Use path as ID
  name: string;
  children?: ArboristNode[];
}

const convertToArboristNode = (item: TFile | TFolder): ArboristNode | null => {
  // Filter out placeholder files
  if (item.name === '.placeholder') {
    return null;
  }

  const isFolder = item instanceof TFolder;
  const children = isFolder
    ? (item as TFolder).children
        .map(convertToArboristNode)
        .filter((n): n is ArboristNode => n !== null) // Filter out nulls from .placeholder files
        .sort((a, b) => {
          const aIsFolder = !!a.children;
          const bIsFolder = !!b.children;
          if (aIsFolder !== bIsFolder) {
            return aIsFolder ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        })
    : undefined;

  return {
    id: item.path,
    name: item.name,
    children,
  };
};

// Custom Node renderer to handle clicks and styling
const NodeRenderer = ({ node, style, dragHandle }: { node: NodeApi<ArboristNode>; style: React.CSSProperties; dragHandle?: (el: HTMLDivElement | null) => void; }) => {
  return (
    <div
      ref={dragHandle}
      style={style}
      className={`file-tree-node ${node.isInternal ? 'is-folder' : 'is-file'} ${node.isSelected ? 'is-selected' : ''}`}
      onClick={() => node.isInternal ? node.toggle() : node.select()}
    >
      {node.isInternal && (
        <span className="folder-arrow">{node.isOpen ? '▼' : '►'}</span>
      )}
      {node.data.name}
    </div>
  );
};

export const FileTreeView: React.FC<FileTreeViewProps> = ({ onFileSelect }) => {
  const [treeData, setTreeData] = useState<ArboristNode[]>([]);
  const treeRef = useRef<any>(null); // To call imperative API methods

  const updateTree = () => {
    const root = app.vault.getAllFolders().find(f => f.isRoot());
    if (root) {
      const newTree = root.children
        .map(convertToArboristNode)
        .filter((n): n is ArboristNode => n !== null)
        .sort((a, b) => {
          const aIsFolder = !!a.children;
          const bIsFolder = !!b.children;
          if (aIsFolder !== bIsFolder) {
            return aIsFolder ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      setTreeData(newTree);
    }
  };

  useEffect(() => {
    updateTree();
    app.vault.on('create', updateTree);
    app.vault.on('delete', updateTree);
    app.vault.on('rename', updateTree); // Good practice to also listen for rename

    return () => {
      app.vault.off('create', updateTree);
      app.vault.off('delete', updateTree);
      app.vault.off('rename', updateTree);
    };
  }, []);

  const getSelectedPath = () => {
    const selectedNode = treeRef.current?.selectedNodes[0];
    if (selectedNode) {
      // If a folder is selected, create inside it.
      // If a file is selected, create in its parent folder.
      return selectedNode.isInternal ? selectedNode.id : selectedNode.parent?.id || '';
    }
    return ''; // Root if nothing is selected
  };

  const handleAddFile = () => {
    const parentPath = getSelectedPath();
    const fileName = prompt(`Enter file name to add in '${parentPath || '/'}':`);
    if (fileName) {
      const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName;
      app.vault.create(fullPath, `# ${fileName.split('/').pop()}\n\n`);
    }
  };

  const handleAddFolder = () => {
    const parentPath = getSelectedPath();
    const folderName = prompt(`Enter folder name to add in '${parentPath || '/'}':`);
    if (folderName) {
      const fullPath = parentPath ? `${parentPath}/${folderName}` : folderName;
      app.vault.createFolder(fullPath);
    }
  };

  return (
    <div className="file-tree-container">
       <div className="file-tree-header">
        <h2>crashOS</h2>
        <div className="actions">
          <button onClick={handleAddFile} title="New File"><FaFileMedical /></button>
          <button onClick={handleAddFolder} title="New Folder"><FaFolderPlus /></button>
        </div>
      </div>
      <div className="tree-view">
        <Tree
          ref={treeRef}
          data={treeData}
          openByDefault={false}
          width={250}
          height={1000} // Adjust height as needed
          onActivate={(node) => {
            if (!node.isInternal) {
              onFileSelect(node.id);
            }
          }}
          // The component passed as a child is used to render each node
        >
          {NodeRenderer}
        </Tree>
      </div>
    </div>
  );
}; 