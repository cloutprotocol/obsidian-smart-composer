/**
 * This file implements a lightweight, browser-compatible mock of the Obsidian API.
 * It provides the core `App`, `Vault`, and `Workspace` classes that are essential
 * for creating a compatibility layer for Obsidian plugins on the web.
 */
import { EventEmitter } from 'eventemitter3';

// In-memory file system for the POC
const fileSystem = new Map<string, string>();
fileSystem.set('Welcome.md', '# Welcome to your new vault!\n\nThis is a sample note.');

class Vault extends EventEmitter {
    private fileSystem: Map<string, string>;

    constructor(fileSystem: Map<string, string>) {
        super();
        this.fileSystem = fileSystem;
    }

    async read(path: string): Promise<string> {
        if (this.fileSystem.has(path)) {
            return this.fileSystem.get(path)!;
        }
        throw new Error(`File not found: ${path}`);
    }

    async write(path: string, content: string): Promise<void> {
        this.fileSystem.set(path, content);
        this.emit('modify', path); // Emitting an event that a file has been modified
    }

    async delete(path: string): Promise<void> {
        if (this.fileSystem.has(path)) {
            this.fileSystem.delete(path);
            this.emit('delete', path);
        }
    }
    
    // In a real implementation this would return TFile and TFolder objects
    getFiles() {
        return Array.from(this.fileSystem.keys()).map(path => ({ path, name: path }));
    }
    
    // Simplified create
    async create(path: string, content: string): Promise<void> {
        if (this.fileSystem.has(path)) {
            throw new Error(`File already exists: ${path}`);
        }
        this.fileSystem.set(path, content);
        this.emit('create', path);
    }
}

class Workspace extends EventEmitter {
    activeFile: { path: string } | null = null;

    openLinkText(linktext: string, sourcePath: string, newLeaf?: boolean): Promise<void> {
        console.log(`Opening link: ${linktext} from ${sourcePath} in new leaf: ${newLeaf}`);
        this.activeFile = { path: linktext };
        this.emit('file-open', this.activeFile);
        return Promise.resolve();
    }
    
    getActiveFile() {
        return this.activeFile;
    }
}

export class App {
    public vault: Vault;
    public workspace: Workspace;

    constructor() {
        this.vault = new Vault(fileSystem);
        this.workspace = new Workspace();
    }
}

// Singleton instance of the App
export const app = new App(); 