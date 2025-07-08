/**
 * This component renders the file and folder structure of the vault.
 * It interacts with the `Vault` API to display the file list,
 * handles file creation, and runs the API test suite.
 */
import React, { useState, useEffect } from 'react';
import { app } from '../lib/obsidian-api';

interface FileTreeViewProps {
  files: string[];
  onFileSelect: (path: string) => void;
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({ files, onFileSelect }) => {
  const handleAddFile = () => {
    const fileName = prompt('Enter file name (e.g., new-note.md):');
    if (fileName) {
      // Check if a file with this name already exists
      const fileExists = files.some(f => f === fileName);
      if (fileExists) {
        alert(`A file named "${fileName}" already exists.`);
        return;
      }
      app.vault.create(fileName, `# ${fileName}\n\n`);
    }
  };

  const runApiTests = async () => {
    console.log('--- Running API Tests ---');
  
    // Test: Create a file
    const testFilePath = 'TestNote.md';
    const testFileContent = '# Test Note\n\nThis is a test.';
    try {
      // After creating, we should get a TFile object back
      const createdFile = await app.vault.create(testFilePath, testFileContent);
      console.log(`✅ SUCCESS: app.vault.create('${testFilePath}')`);
      
      // Test: Read the created file using the TFile object
      const content = await app.vault.read(createdFile);
      if (content === testFileContent) {
        console.log(`✅ SUCCESS: app.vault.read('${testFilePath}')`);
      } else {
        console.error(`❌ FAILURE: app.vault.read('${testFilePath}') returned unexpected content.`);
      }
  
      // Test: Write to the file
      const updatedContent = `${testFileContent}\n\nAppended text.`;
      await app.vault.write(createdFile, updatedContent);
      const newContent = await app.vault.read(createdFile);
      if (newContent === updatedContent) {
          console.log(`✅ SUCCESS: app.vault.write('${testFilePath}')`);
      } else {
          console.error(`❌ FAILURE: app.vault.write('${testFilePath}') did not update content correctly.`);
      }
  
      // Test: Delete the file
      await app.vault.delete(createdFile);
      const files = app.vault.getFiles();
      if (!files.some(f => f.path === testFilePath)) {
          console.log(`✅ SUCCESS: app.vault.delete('${testFilePath}')`);
      } else {
          console.error(`❌ FAILURE: app.vault.delete('${testFilePath}') did not remove the file.`);
      }
  
    } catch (e) {
      console.error(`❌ An error occurred during the test:`, e);
    }
  
    console.log('--- API Tests Complete ---');
  };

  return (
    <div className="sidebar">
      <h2>Vault</h2>
      <div className="actions">
        <button onClick={handleAddFile}>Add File</button>
        <button onClick={runApiTests}>Run API Tests</button>
      </div>
      <div>
        {files.map((filePath) => (
          <div key={filePath} className="file-tree-node" onClick={() => onFileSelect(filePath)}>
            {filePath.split('/').pop()}
          </div>
        ))}
      </div>
    </div>
  );
}; 