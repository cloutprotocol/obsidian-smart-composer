/**
 * This component renders the file and folder structure of the vault.
 * It interacts with the `Vault` API to display the file list,
 * handles file creation, and runs the API test suite.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Tree, NodeApi } from 'react-arborist';
import { FaFile, FaFolder, FaFolderOpen, FaPlus, FaFolderPlus } from 'react-icons/fa';
import { app, TFile, TFolder } from '../lib/obsidian-api';
import styles from './FileTreeView.module.css'; // Import the new CSS module

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
  if (item.name === '.placeholder') {
    return null;
  }

  const isFolder = item instanceof TFolder;
  const children = isFolder
    ? (item as TFolder).children
        .map(convertToArboristNode)
        .filter((n): n is ArboristNode => n !== null)
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
  const isFolder = node.isInternal;
  const Icon = isFolder ? (node.isOpen ? FaFolderOpen : FaFolder) : FaFile;

  return (
    <div
      ref={dragHandle}
      style={style}
      className={`${styles.nodeContainer} ${node.isSelected ? styles.nodeContainerSelected : ''}`}
      onClick={() => node.isInternal ? node.toggle() : node.select()}
    >
      <Icon className={styles.nodeIcon} />
      <span className={styles.nodeText}>{node.data.name}</span>
    </div>
  );
};

export const FileTreeView: React.FC<FileTreeViewProps> = ({ onFileSelect }) => {
  const [treeData, setTreeData] = useState<ArboristNode[]>([]);
  const treeRef = useRef<any>(null); // To call imperative API methods
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setHeight(entry.contentRect.height);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);


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
    app.vault.on('rename', updateTree);

    return () => {
      app.vault.off('create', updateTree);
      app.vault.off('delete', updateTree);
      app.vault.off('rename', updateTree);
    };
  }, []);

  const getSelectedPath = () => {
    const selectedNode = treeRef.current?.selectedNodes[0];
    if (selectedNode) {
      return selectedNode.isInternal ? selectedNode.id : selectedNode.parent?.id || '';
    }
    return ''; // Root if nothing is selected
  };

  const handleAddFile = () => {
    const parentPath = getSelectedPath();
    const fileName = prompt(`Enter new file name in '${parentPath || 'vault root'}':`);
    if (fileName) {
      const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName;
      app.vault.create(fullPath, `# ${fileName.split('/').pop()}\n\n`);
    }
  };

  const handleAddFolder = () => {
    const parentPath = getSelectedPath();
    const folderName = prompt(`Enter new folder name in '${parentPath || 'vault root'}':`);
    if (folderName) {
      const fullPath = parentPath ? `${parentPath}/${folderName}` : folderName;
      app.vault.createFolder(fullPath);
    }
  };

  return (
    <div className={styles.fileTreeViewContainer}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>crashOS</h2>
        <div className={styles.headerActions}>
          <button onClick={handleAddFile} title="New File" className={styles.actionButton}>
            <FaPlus />
          </button>
          <button onClick={handleAddFolder} title="New Folder" className={styles.actionButton}>
            <FaFolderPlus />
          </button>
        </div>
      </div>
      <div className={styles.treeContainer} ref={containerRef}>
        <Tree
          ref={treeRef}
          data={treeData}
          openByDefault={false}
          width="100%"
          height={height}
          onActivate={(node) => {
            if (!node.isInternal) {
              onFileSelect(node.id);
            }
          }}
          indent={24}
        >
          {NodeRenderer}
        </Tree>
      </div>
    </div>
  );
}; 