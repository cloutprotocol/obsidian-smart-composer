/**
 * This file implements a lightweight, browser-compatible mock of the Obsidian API.
 * It provides the core `App`, `Vault`, and `Workspace` classes that are essential
 * for creating a compatibility layer for Obsidian plugins on the web.
 */
import { EventEmitter } from 'eventemitter3';

// --- HTMLElement Polyfills for Obsidian API Compatibility ---
// In Obsidian, the global HTMLElement is augmented with helper methods.
// We need to replicate them for our plugins to work.

type DomElementInfo = {
  cls?: string;
  text?: string;
};

declare global {
  interface HTMLElement {
    empty(): void;
    createEl<K extends keyof HTMLElementTagNameMap>(tag: K, o?: DomElementInfo | string, cb?: (el: HTMLElementTagNameMap[K]) => void): HTMLElementTagNameMap[K];
  }
}

HTMLElement.prototype.empty = function(): void {
  while (this.firstChild) {
    this.removeChild(this.firstChild);
  }
};

HTMLElement.prototype.createEl = function<K extends keyof HTMLElementTagNameMap>(
  this: HTMLElement,
  tag: K,
  o?: DomElementInfo | string,
  cb?: (el: HTMLElementTagNameMap[K]) => void
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (o) {
    if (typeof o === 'string') {
      el.className = o;
    } else {
      if (o.cls) el.className = o.cls;
      if (o.text) el.textContent = o.text;
    }
  }
  if (cb) {
    cb(el);
  }
  this.appendChild(el);
  return el;
};


// --- Mock Obsidian API ---

export class Component {
  onload() {}
  onunload() {}
}

export function getIcon(iconId: string): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    console.log(`[Mock API] getIcon called for: ${iconId}`);
    return svg;
}

export function normalizePath(path: string): string {
    return path.replace(/\\\\/g, '/');
}

export async function requestUrl(options: any): Promise<any> {
    console.log(`[Mock API] requestUrl called with:`, options);
    return Promise.resolve({ status: 200, json: {}, text: '' });
}

export function htmlToMarkdown(html: string): string {
    console.log(`[Mock API] htmlToMarkdown called`);
    return html; // Passthrough mock
}

export function MarkdownRenderer(app: App, markdown: string, el: HTMLElement, sourcePath: string, component: Component) {
    console.log("[Mock API] MarkdownRenderer called");
    el.innerHTML = markdown; // Extremely simplified version
}

export const Platform = {
    isMobile: false,
    isDesktop: true,
};

export class Keymap {} // Added missing Keymap export

class BaseComponent {
    el: HTMLElement;
    constructor() {
        this.el = document.createElement('div');
    }
}

export class ButtonComponent extends BaseComponent {
    setButtonText(text: string) { this.el.textContent = text; return this; }
    onClick(cb: () => void) { this.el.onclick = cb; return this; }
}

export class DropdownComponent extends BaseComponent {
    addOption(value: string, display: string) { return this; }
    onChange(cb: (value: string) => void) { return this; }
    getValue() { return ''; }
}

export class TextComponent extends BaseComponent {
    setValue(value: string) { return this; }
    onChange(cb: (value: string) => void) { return this; }
}

export class TextAreaComponent extends BaseComponent {
    setValue(value: string) { return this; }
    onChange(cb: (value: string) => void) { return this; }
}

export class ToggleComponent extends BaseComponent {
    setValue(value: boolean) { return this; }
    onChange(cb: (value: boolean) => void) { return this; }
}

export class Setting {
    controlEl: HTMLElement;
    constructor(containerEl: HTMLElement) {
        this.controlEl = containerEl.createDiv();
    }
    setName(name: string) { return this; }
    setDesc(desc: string) { return this; }
    addButton(cb: (button: ButtonComponent) => void) { return this; }
    addDropdown(cb: (dropdown: DropdownComponent) => void) { return this; }
    addToggle(cb: (toggle: ToggleComponent) => void) { return this; }
    addText(cb: (text: TextComponent) => void) { return this; }
    addTextArea(cb: (text: TextAreaComponent) => void) { return this; }
}

export class Modal {
    app: App;
    contentEl: HTMLElement;
    constructor(app: App) {
        this.app = app;
        // In a real app, you'd create a proper modal structure
        this.contentEl = document.createElement('div');
        console.log("[Mock API] Modal created");
    }
    open() { console.log("[Mock API] Modal.open()"); }
    close() { console.log("[Mock API] Modal.close()"); }
}

export abstract class PluginSettingTab {
    app: App;
    plugin: Plugin;
    constructor(app: App, plugin: Plugin) {
        this.app = app;
        this.plugin = plugin;
    }
    abstract display(): void;
}

export class TAbstractFile {
    path: string = '';
    name: string = '';
}
export class TFile extends TAbstractFile {}
export class TFolder extends TAbstractFile {}

// Forward-declare App to satisfy circular dependencies
let app: App;

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
        this.emit('modify', path);
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
    
    async create(path: string, content: string): Promise<void> {
        if (this.fileSystem.has(path)) {
            throw new Error(`File already exists: ${path}`);
        }
        this.fileSystem.set(path, content);
        this.emit('create', path);
    }
}

export class View { // Now defined BEFORE ItemView
    app: App;
    constructor(app: App) {
        this.app = app;
    }
}

export abstract class ItemView extends View { // Extends the now-defined View
    public leaf: WorkspaceLeaf;
    public containerEl: HTMLElement;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf.app);
        this.leaf = leaf;

        // In Obsidian, ItemView has its own container element within the leaf's container.
        // It's structured with a header and content.
        this.containerEl = this.leaf.containerEl; // The root for this view is the leaf's container
        this.containerEl.empty(); // Clear any previous content
        
        // This is a standard structure for ItemViews
        this.containerEl.createEl('div', { cls: 'view-header' }); 
        const contentEl = this.containerEl.createEl('div', { cls: 'view-content' });

        // The 'containerEl' that plugins like ChatView use is actually the *content* part.
        // We re-point this.containerEl to the content container.
        this.containerEl = contentEl;
    }


    abstract getViewType(): string;
    
    async onOpen() {
        // Called when the view is opened.
    }

    async onClose() {
        // Called when the view is closed.
    }
}


export class Editor {
    getSelection(): string {
        // For POC, return a hardcoded value.
        // In a real implementation, this would get the selected text from the editor component.
        return "This is the selected text from the editor.";
    }

    replaceSelection(text: string) {
        console.log(`Replacing selection with: ${text}`);
    }
}

export class MarkdownView extends ItemView {
    editor: Editor;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.editor = new Editor();
    }

    getViewType(): string {
        return 'markdown';
    }
}

export class WorkspaceLeaf {
    public view: any;
    public app: App;
    public containerEl: HTMLElement;
    private id: string;

    constructor(appInstance: App, containerEl: HTMLElement) {
        this.app = appInstance;
        this.containerEl = containerEl;
        this.id = `leaf-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`[Mock API] WorkspaceLeaf created with id: ${this.id}`);
    }

    async setViewState(state: { type: string, active?: boolean }) {
        console.log(`[Mock API] setViewState called on leaf ${this.id} with state:`, state);
        const viewFactory = this.app.getViewRegistry().get(state.type);
        if (viewFactory) {
            console.log(`[Mock API] Found view factory for type: ${state.type}`);
            // The registry stores a factory function, not a raw constructor. We call it.
            this.view = viewFactory(this);

            // In Obsidian, onOpen is called after the view is attached. This triggers rendering.
            if (this.view.onOpen) {
                await this.view.onOpen();
                console.log(`[Mock API] Called onOpen() for view type: ${state.type}`);
            }
        } else {
            console.error(`[Mock API] No view constructor found for type: ${state.type}`);
        }
    }

    open(view: any) {
        this.view = view;
    }
    
    getViewState() {
        if (this.view) {
            return { type: this.view.getViewType() };
        }
        return { type: null };
    }
}

class Workspace extends EventEmitter {
    activeFile: { path: string } | null = null;
    private leaves: WorkspaceLeaf[] = [];
    private app: App;

    // Add missing properties to satisfy the obsidian.Workspace interface
    public leftSplit: any = { collapsed: false };
    public rightSplit: any = { collapsed: false };
    public leftRibbon: any = { el: document.createElement('div') };
    public rightRibbon: any = { el: document.createElement('div') };
    public rootSplit: any = {};
    public activeLeaf: WorkspaceLeaf | null = null;


    constructor(appInstance: App) {
        super();
        this.app = appInstance;
    }

    async openLinkText(linktext: string, sourcePath: string, newLeaf?: boolean): Promise<void> {
        console.log(`[Mock API] Opening link: ${linktext}`);
        this.activeFile = { path: linktext };
        
        const leaf = this.getEditorLeaf();
        const view = new MarkdownView(leaf);
        leaf.open(view);

        this.emit('file-open', this.activeFile);
    }
    
    getActiveFile() {
        return this.activeFile;
    }

    getLeavesOfType(viewType: string) {
        console.log(`[Mock API] getLeavesOfType called for: ${viewType}`);
        return this.leaves.filter(leaf => leaf.getViewState().type === viewType);
    }

    getRightLeaf(create: boolean): WorkspaceLeaf | null {
        // For POC, we'll always deal with one "right" leaf.
        let rightLeaf = this.leaves.find(leaf => leaf.containerEl.parentElement?.classList.contains('right-sidebar'));

        console.log(`[Mock API] getRightLeaf called. Found existing leaf:`, rightLeaf);

        if (!rightLeaf && create) {
            const rightSidebar = document.querySelector('.right-sidebar');
            if (rightSidebar) {
                const leafContainer = document.createElement('div');
                leafContainer.classList.add('workspace-leaf-content');
                
                const newLeaf = new WorkspaceLeaf(this.app, leafContainer as HTMLElement);
                this.leaves.push(newLeaf);
                console.log(`[Mock API] Created new right leaf:`, newLeaf);
                return newLeaf; // Ensure the new leaf is returned immediately.
            } else {
                 console.error("[Mock API] .right-sidebar container not found!");
            }
        }
        return rightLeaf || null;
    }

    // This is a new method for the POC to get the main editor leaf
    getEditorLeaf(): WorkspaceLeaf {
        let editorLeaf = this.leaves.find(leaf => leaf.containerEl.parentElement?.classList.contains('editor-container'));

        if (!editorLeaf) {
            const editorContainer = document.querySelector('.editor-container');
            if (editorContainer) {
                const leafContainer = document.createElement('div');
                leafContainer.classList.add('workspace-leaf-content');
                editorContainer.appendChild(leafContainer);
                editorLeaf = new WorkspaceLeaf(this.app, leafContainer as HTMLElement);
                this.leaves.push(editorLeaf);
                this.activeLeaf = editorLeaf;
            } else {
                throw new Error("Could not find '.editor-container' to create a leaf.");
            }
        }
        return editorLeaf;
    }


    getActiveViewOfType(type: any): MarkdownView | null {
        const typeName = typeof type === 'string' ? type : type.name;
        // This is a simplified mock. It finds the first view of the given type.
        if (this.activeLeaf && this.activeLeaf.view?.constructor.name === typeName) {
            return this.activeLeaf.view as MarkdownView;
        }
        // Fallback search if activeLeaf isn't the one
        for (const leaf of this.leaves) {
            if (leaf.view?.constructor.name === typeName) {
                this.activeLeaf = leaf; // Set it as active
                return leaf.view as MarkdownView;
            }
        }
        return null;
    }


    revealLeaf(leaf: WorkspaceLeaf) {
        console.log("[Mock API] revealLeaf called for leaf:", leaf);
        if (!leaf) {
            console.error("[Mock API] revealLeaf called with null or undefined leaf.");
            return;
        }
        if (!leaf.view) {
            console.error("[Mock API] revealLeaf called, but leaf has no view attached!", leaf);
            return;
        }

        this.activeLeaf = leaf;
        const rightSidebar = document.querySelector('.right-sidebar');
        if (rightSidebar && !rightSidebar.contains(leaf.containerEl)) {
             // Clear any existing content
            while (rightSidebar.firstChild) {
                rightSidebar.removeChild(rightSidebar.firstChild);
            }
            console.log("[Mock API] Appending leaf container to right sidebar.");
            rightSidebar.appendChild(leaf.containerEl);
        }
        this.emit('active-leaf-change', leaf);
    }
}

export class Plugin {
    public app: App;
    public manifest: { id: string; name: string; version: string };

    constructor(appInstance: App, manifest: { id: string; name: string; version: string }) {
        this.app = appInstance;
        this.manifest = manifest;
    }

    async onload() {}
    async onunload() {}

    async loadData(): Promise<any> {
        const data = localStorage.getItem(this.manifest.id);
        return data ? JSON.parse(data) : null;
    }

    async saveData(data: any): Promise<void> {
        localStorage.setItem(this.manifest.id, JSON.stringify(data));
    }

    addCommand(command: any) {
        this.app.addCommand(command);
    }

    registerView(type: string, constructor: (leaf: WorkspaceLeaf) => any) {
        this.app.registerView(type, constructor);
    }

    addRibbonIcon(icon: string, title: string, callback: () => void): HTMLElement {
        return this.app.addRibbonIcon(icon, title, callback);
    }

    addSettingTab(tab: PluginSettingTab) {
        this.app.addSettingTab(tab);
    }
}

export class App {
    public vault: Vault;
    public workspace: Workspace;
    private viewRegistry: Map<string, any> = new Map();
    private commands: any[] = [];

    // Add missing properties to satisfy the obsidian.App interface
    public keymap: any = {};
    public scope: any = {};
    public metadataCache: any = {
        getTags: () => ({}) // Mock implementation
    };
    public fileManager: any = {};
    public lastEvent: any = null;

    constructor() {
        this.vault = new Vault(fileSystem);
        this.workspace = new Workspace(this);
    }

    registerView(type: string, constructor: any) {
        this.viewRegistry.set(type, constructor);
    }

    getViewRegistry() {
        return this.viewRegistry;
    }

    addCommand(command: any) {
        if (!this.commands.find(c => c.id === command.id)) {
            this.commands.push(command);
        }
    }

    getCommands() {
        return this.commands;
    }

    addSettingTab(tab: PluginSettingTab) {
        // For POC, we can just log this. A real implementation would render the tab.
        console.log(`[Mock API] Setting tab added:`, tab);
    }

    addRibbonIcon(icon: string, title: string, callback: () => void): HTMLElement {
        console.log(`Adding ribbon icon: ${title}`);
        // For POC, create a button and append it to a dedicated ribbon container.
        const ribbonBar = document.getElementById('ribbon-bar'); // Assuming this exists in the POC's HTML
        if (!ribbonBar) {
            console.error("Ribbon bar element not found!");
            return document.createElement('div'); // Return a dummy element
        }

        const iconEl = document.createElement('button');
        iconEl.className = 'ribbon-icon';
        iconEl.setAttribute('aria-label', title);
        iconEl.innerHTML = `<span>${icon}</span>`; // Using text for icon for simplicity
        iconEl.onclick = callback;
        
        ribbonBar.appendChild(iconEl);

        return iconEl;
    }
}

export class Notice {
    constructor(message: string) {
        // In a real app, this would show a toast notification.
        console.log(`[Notice] ${message}`);
        // For the POC, we can create a simple, temporary DOM element.
        const noticeEl = document.createElement('div');
        noticeEl.textContent = message;
        noticeEl.style.position = 'fixed';
        noticeEl.style.top = '20px';
        noticeEl.style.right = '20px';
        noticeEl.style.padding = '10px 20px';
        noticeEl.style.backgroundColor = '#343434';
        noticeEl.style.color = 'white';
        noticeEl.style.borderRadius = '5px';
        noticeEl.style.zIndex = '1000';
        document.body.appendChild(noticeEl);
        setTimeout(() => {
            document.body.removeChild(noticeEl);
        }, 3000);
    }
}

app = new App();
export { app }; 