/**
 * This file implements a lightweight, browser-compatible mock of the Obsidian API.
 * It provides the core `App`, `Vault`, and `Workspace` classes that are essential
 * for creating a compatibility layer for Obsidian plugins on the web.
 */
import { EventEmitter } from 'eventemitter3';
import { FileSystemState, VirtualFile } from '../../src/App';

// --- HTMLElement Polyfills for Obsidian API Compatibility ---
// In Obsidian, the global HTMLElement is augmented with helper methods.
// We need to replicate them for our plugins to work.

type DomElementInfo = {
  cls?: string;
  text?: string;
  type?: string;
};

declare global {
  interface HTMLElement {
    empty(): void;
    createEl<K extends keyof HTMLElementTagNameMap>(tag: K, o?: DomElementInfo | string, cb?: (el: HTMLElementTagNameMap[K]) => void): HTMLElementTagNameMap[K];
    createDiv(o?: DomElementInfo | string, cb?: (el: HTMLDivElement) => void): HTMLDivElement;
    setAttrs(attrs: Record<string, string>): void;
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
      if (o.type && el instanceof HTMLInputElement) el.type = o.type;
    }
  }
  if (cb) {
    cb(el);
  }
  this.appendChild(el);
  return el;
};

HTMLElement.prototype.createDiv = function (
  o?: DomElementInfo | string,
  cb?: (el: HTMLDivElement) => void
): HTMLDivElement {
  return this.createEl('div', o, cb);
};

HTMLElement.prototype.setAttrs = function (attrs: Record<string, string>): void {
  for (const key in attrs) {
    this.setAttribute(key, attrs[key]);
  }
};

export interface Command {
  id: string;
  name:string;
  callback?: () => void;
  editorCallback?: (editor: Editor, view: MarkdownView) => void;
}


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
    // Add a guard clause to prevent crashes on undefined input.
    // This can happen during component lifecycle races.
    if (!path) {
        return '';
    }
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

/**
 * In the real Obsidian API, `MarkdownRenderer` is a static class or namespace
 * with a `render` method. Our original implementation was a standalone function,
 * which caused a `TypeError` when components tried to call `MarkdownRenderer.render`.
 * This has been corrected to match the expected API structure.
 */
export const MarkdownRenderer = {
    render: (app: App, markdown: string, el: HTMLElement, sourcePath: string, component: Component) => {
        console.log("[Mock API] MarkdownRenderer.render called");
        el.innerHTML = markdown; // Extremely simplified version
    }
};

export const Platform = {
    isMobile: false,
    isDesktop: true,
};

export class Keymap {} // Added missing Keymap export

export class ButtonComponent {
    public buttonEl: HTMLButtonElement;
    constructor(containerEl: HTMLElement) {
        this.buttonEl = containerEl.createEl('button');
    }
    setButtonText(text: string) { this.buttonEl.textContent = text; return this; }
    setIcon(icon: string) { /* In POC, we can ignore icons or use text */ return this; }
    setTooltip(tooltip: string) { this.buttonEl.title = tooltip; return this; }
    setCta() { this.buttonEl.classList.add('mod-cta'); return this; }
    setWarning() { this.buttonEl.classList.add('mod-warning'); return this; }
    setDisabled(disabled: boolean) { this.buttonEl.disabled = disabled; return this; }
    onClick(cb: () => void) { this.buttonEl.addEventListener('click', cb); }
}

export class TextComponent {
    public inputEl: HTMLInputElement;
    constructor(containerEl: HTMLElement) {
        this.inputEl = containerEl.createEl('input', { cls: 'setting-input', type: 'text' });
    }
    setValue(value: string) { this.inputEl.value = value; return this; }
    onChange(cb: (value: string) => void) { this.inputEl.addEventListener('input', (e) => cb((e.target as HTMLInputElement).value)); }
    setPlaceholder(placeholder: string) { this.inputEl.placeholder = placeholder; return this; }
}

export class TextAreaComponent {
    public inputEl: HTMLTextAreaElement;
    constructor(containerEl: HTMLElement) {
        this.inputEl = containerEl.createEl('textarea', { cls: 'setting-textarea' });
    }
    setValue(value: string) { this.inputEl.value = value; return this; }
    onChange(cb: (value: string) => void) { this.inputEl.addEventListener('input', (e) => cb((e.target as HTMLTextAreaElement).value)); }
    setPlaceholder(placeholder: string) { this.inputEl.placeholder = placeholder; return this; }
}

export class DropdownComponent extends Component {
    selectEl: HTMLSelectElement;

    constructor(containerEl: HTMLElement) {
        super();
        // The original mock was empty. This was fleshed out to create a real
        // <select> element, because the React components that use this class
        // (`ObsidianDropdown`) expect `selectEl` to be a valid DOM element
        // they can manipulate and attach event listeners to.
        this.selectEl = containerEl.createEl('select', 'dropdown');
    }
    addOption(value: string, display: string) {
        this.selectEl.add(new Option(display, value));
        return this;
    }
    // This method was missing from the mock. It's used by `ObsidianDropdown`
    // to populate the select options dynamically.
    addOptions(options: Record<string, string>) {
        for(const value in options) {
            this.addOption(value, options[value]);
        }
        return this;
    }
    onChange(cb: (value: string) => void) {
        this.selectEl.addEventListener('change', (e) => cb((e.target as HTMLSelectElement).value));
        return this;
    }
    getValue() {
        return this.selectEl.value;
    }
    setValue(value: string) {
        this.selectEl.value = value;
        return this;
    }
}

export class ToggleComponent extends Component {
    toggleEl: HTMLElement;
    private inputEl: HTMLInputElement;
    private sliderEl: HTMLDivElement;

    constructor(containerEl: HTMLElement) {
        super();
        // Refactored to produce the structure needed for the iOS-style toggle.
        // The structure is now a container with a hidden checkbox and a visual 'slider'.
        this.toggleEl = containerEl.createEl('div', { cls: 'checkbox-container' });
        this.inputEl = this.toggleEl.createEl('input', { type: 'checkbox' });
        this.sliderEl = this.toggleEl.createEl('div', { cls: 'slider round' });
    }
    setValue(value: boolean) {
        this.inputEl.checked = value;
        return this;
    }
    onChange(cb: (value: boolean) => void) {
        this.inputEl.addEventListener('change', (e) => cb((e.target as HTMLInputElement).checked));
        return this;
    }
}

export class Setting {
    settingEl: HTMLElement;
    infoEl: HTMLElement;
    nameEl: HTMLElement;
    descEl: HTMLElement;
    controlEl: HTMLElement;

    constructor(containerEl: HTMLElement) {
        // The original mock `Setting` class was too simplistic and caused a crash
        // because it didn't create the expected DOM structure. Specifically, the
        // `ObsidianSetting` React component directly accesses `settingEl` and `nameEl`.
        // This constructor now builds a DOM structure that mirrors the real Obsidian
        // API, preventing null reference errors. It also uses `createDiv`, a
        // polyfill we added to HTMLElement.
        this.settingEl = containerEl.createDiv({ cls: 'setting-item' });
        this.infoEl = this.settingEl.createDiv({ cls: 'setting-item-info' });
        this.nameEl = this.infoEl.createDiv({ cls: 'setting-item-name' });
        this.descEl = this.infoEl.createDiv({ cls: 'setting-item-description' });
        this.controlEl = this.settingEl.createDiv({ cls: 'setting-item-control' });
    }
    setName(name: string) {
        this.nameEl.textContent = name;
        return this;
    }
    setDesc(desc: string) {
        this.descEl.textContent = desc;
        return this;
    }
    setHeading() {
      this.settingEl.classList.add('setting-item-heading');
      return this;
    }
    // The `clear` method was missing. `ObsidianSetting` calls this on unmount
    // to clean up the setting's DOM elements, preventing memory leaks.
    clear() {
        this.settingEl.remove();
    }
    addButton(cb: (button: ButtonComponent) => void) {
        const button = new ButtonComponent(this.controlEl);
        cb(button);
        return this;
    }
    addDropdown(cb: (dropdown: DropdownComponent) => void) {
        const dropdown = new DropdownComponent(this.controlEl);
        cb(dropdown);
        return this;
    }
    addToggle(cb: (toggle: ToggleComponent) => void) {
        const toggle = new ToggleComponent(this.controlEl);
        cb(toggle);
        return this;
    }
    addText(cb: (text: TextComponent) => void) {
        const text = new TextComponent(this.controlEl);
        cb(text);
        return this;
    }
    addTextArea(cb: (text: TextAreaComponent) => void) {
        const text = new TextAreaComponent(this.controlEl);
        cb(text);
        return this;
    }
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
    id: string;
    name: string;
    containerEl: HTMLElement;

    constructor(app: App, plugin: Plugin) {
        this.app = app;
        this.plugin = plugin;
        this.id = plugin.manifest.id;
        // The tab's name is initialized from the plugin's manifest. This provides a
        // sensible default. The actual `SettingTab` class for the plugin then
        // overwrites this with a more specific name in its own constructor.
        // This was changed from `''` to fix a bug where tab titles were missing.
        this.name = plugin.manifest.name; // Name is set by the plugin
        // The real container is provided by the settings modal when display() is called.
        // We initialize it here to satisfy the type.
        this.containerEl = document.createElement('div');
    }
    abstract display(): void;
    hide() {
        // In a real implementation, this would contain logic to hide the setting tab's contents.
    }
}

// --- Hierarchical File System Abstractions ---

export class TAbstractFile {
    path: string;
    name: string;
    parent: TFolder | null;

    constructor(path: string, parent: TFolder | null = null) {
        this.path = normalizePath(path);
        this.name = path.split('/').pop() ?? path;
        this.parent = parent;
    }
}

export class TFile extends TAbstractFile {
    stat: {
        mtime: number; // Last modified time
    };
    extension: string;

    constructor(path: string, parent: TFolder | null, mtime: number) {
        super(path, parent);
        this.stat = { mtime };
        this.extension = path.split('.').pop() ?? '';
    }
}

export class TFolder extends TAbstractFile {
    children: (TFile | TFolder)[] = [];

    isRoot(): boolean {
        return this.path === '/';
    }
}

type FileSystemNode = {
    type: 'file';
    content: string;
    mtime: number;
} | {
    type: 'folder';
    children: Map<string, FileSystemNode>;
};

let virtualFileSystem: FileSystemState = {};

export function initializeFileSystem(initialState: FileSystemState) {
    virtualFileSystem = initialState;
}

/**
 * Traverses the file system representation to build lists of TFile and TFolder objects.
 * This function is recursive and explores the file tree structure.
 */
function traverse(
    node: FileSystemNode,
    path: string,
    parentFolder: TFolder | null,
    files: TFile[],
    folders: TFolder[]
) {
    if (node.type === 'folder') {
        const currentFolder = new TFolder(path, parentFolder);
        if(parentFolder) parentFolder.children.push(currentFolder);
        folders.push(currentFolder);

        for (const [name, childNode] of node.children.entries()) {
            const childPath = path === '/' ? name : `${path}/${name}`;
            traverse(childNode, childPath, currentFolder, files, folders);
        }
    } else {
        const file = new TFile(path, parentFolder, node.mtime);
        if(parentFolder) parentFolder.children.push(file);
        files.push(file);
    }
}


class Vault extends EventEmitter {
    constructor() {
        super();
    }

    private getHierarchy(): TFolder {
        const fs = virtualFileSystem;
        const root = new TFolder('/', null);
        const folders = new Map<string, TFolder>([['', root]]);

        const ensureFolder = (path: string): TFolder => {
            if (folders.has(path)) {
                return folders.get(path)!;
            }
            const parentPath = path.substring(0, path.lastIndexOf('/'));
            const parentFolder = ensureFolder(parentPath === '' ? '' : parentPath);
            const folderName = path.substring(path.lastIndexOf('/') + 1);
            const newFolder = new TFolder(path, parentFolder);
            newFolder.name = folderName;
            folders.set(path, newFolder);
            parentFolder.children.push(newFolder);
            return newFolder;
        };
        
        // Ensure all directories exist first
        for (const path in fs) {
            if (path.includes('/')) {
                ensureFolder(path.substring(0, path.lastIndexOf('/')));
            }
        }

        // Add files to their respective folders
        for (const path in fs) {
            const fileData = fs[path];
            const parentPath = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
            const parentFolder = folders.get(parentPath)!;
            const file = new TFile(path, parentFolder, fileData.mtime || Date.now());
            parentFolder.children.push(file);
        }

        return root;
    }

    async read(file: TFile): Promise<string> {
        const fs = virtualFileSystem;
        console.log(`[Mock API] vault.read: ${file.path}`);
        return fs[file.path]?.content ?? '';
    }

    async cachedRead(file: TFile): Promise<string> {
        return this.read(file);
    }
    
    async write(file: TFile, content: string): Promise<void> {
        console.log(`[Mock API] vault.write: ${file.path}`);
        if (virtualFileSystem[file.path]) {
            virtualFileSystem[file.path].content = content;
        } else {
            virtualFileSystem[file.path] = { content, mtime: Date.now() };
        }
    }

    async modify(file: TFile, content: string): Promise<void> {
        console.log(`[Mock API] vault.modify: ${file.path}`);
        if (virtualFileSystem[file.path]) {
            virtualFileSystem[file.path].content = content;
        } else {
            virtualFileSystem[file.path] = { content, mtime: Date.now() };
        }
        this.emit('modify', this.getFileByPath(file.path));
    }

    async delete(file: TAbstractFile): Promise<void> {
        console.log(`[Mock API] vault.delete: ${file.path}`);
        delete virtualFileSystem[file.path];
        this.emit('delete', file);
    }

    getFiles(): TFile[] {
        const files: TFile[] = [];
        const traverse = (folder: TFolder) => {
            for (const child of folder.children) {
                if (child instanceof TFile) {
                    files.push(child);
                } else if (child instanceof TFolder) {
                    traverse(child);
                }
            }
        };
        traverse(this.getHierarchy());
        return files;
    }

    getAllFolders(): TFolder[] {
        const folders: TFolder[] = [];
        const traverse = (folder: TFolder) => {
            folders.push(folder);
            for (const child of folder.children) {
                if (child instanceof TFolder) {
                    traverse(child);
                }
            }
        };
        traverse(this.getHierarchy());
        return folders;
    }


    getFileByPath(path: string): TFile | undefined {
        return this.getFiles().find(f => f.path === path);
    }

    async create(path: string, content: string): Promise<TFile> {
        console.log(`[Mock API] vault.create: ${path}`);
        virtualFileSystem[path] = { content, mtime: Date.now() };
        const newFile = new TFile(path, null, Date.now()); // Parent is null for now, getHierarchy will fix
        this.emit('create', newFile);
        return newFile;
    }

    async createFolder(path: string): Promise<void> {
        console.log(`[Mock API] vault.createFolder: ${path}`);
        
        const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
        
        // Check if a file or folder with this name already exists.
        // We check if any existing file path IS the folder path, or is inside the folder path.
        if (this.getFiles().some(f => f.path === normalizedPath || f.path.startsWith(normalizedPath + '/'))) {
            const msg = `A file or folder at path "${normalizedPath}" already exists.`
            console.error(`[Mock API] ${msg}`);
            // In a real app, this might throw. For the POC, alerting is fine.
            alert(msg); 
            return;
        }

        // To represent an empty folder in our flat file system,
        // we'll create a placeholder file. This file will be filtered out in the UI.
        const placeholderPath = `${normalizedPath}/.placeholder`;
        await this.create(placeholderPath, '');
        // The 'create' event is already emitted by `this.create()`, which the UI listens to.
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
    
    getDisplayText(): string {
        // Every view should have a display text. Fallback to view type.
        return this.getViewType();
    }

    async onOpen() {
        // Called when the view is opened.
    }

    async onClose() {
        // Called when the view is closed.
    }

    getState() {
        return {};
    }

    async setState(state: any, options: any) {
        // Base implementation does nothing.
    }
}

export class Editor {
    getValue(): string {
        // In a real implementation, this would get the editor's content.
        // For the POC, we can return a placeholder.
        return (this as any)._value || '';
    }
    setValue(text: string) {
        (this as any)._value = text;
    }
    getSelection(): string {
        return ''; // TODO: Implement if needed
    }
    replaceSelection(text: string) {
        // TODO: Implement if needed
    }
}

export class MarkdownView extends ItemView {
    editor: Editor;
    file: TFile | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.editor = new Editor();
    }
    getViewType(): string {
        return 'markdown';
    }

    getDisplayText(): string {
        return this.file?.name ?? 'Markdown';
    }
}

export class WorkspaceLeaf {
    public view: any;
    public app: App;
    public containerEl: HTMLElement;
    public id: string;

    constructor(appInstance: App, containerEl: HTMLElement) {
        this.app = appInstance;
        this.containerEl = containerEl;
        this.id = `leaf-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`[Mock API] WorkspaceLeaf created with id: ${this.id}`);
    }

    detach() {
        this.app.workspace.detachLeaf(this);
    }

    async setViewState(state: { type: string; active?: boolean; state?: any }) {
        console.log(`[Mock API] setViewState called on leaf ${this.id} with state:`, state);
        const viewFactory = this.app.getViewRegistry().get(state.type);
        if (viewFactory) {
            console.log(`[Mock API] Found view factory for type: ${state.type}`);
            this.view = viewFactory(this);

            // If state is provided, call the view's setState method.
            // This is crucial for views like ApplyView that depend on initial data.
            if (state.state && this.view.setState) {
                await this.view.setState(state.state, {});
                console.log(`[Mock API] Called setState() for view type: ${state.type}`);
            }

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
        return { 
            type: this.view?.getViewType(), 
            active: true,
            state: this.view?.getState ? this.view.getState() : {},
        };
    }
}

class Workspace extends EventEmitter {
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

    async openLinkText(linktext: string, sourcePath: string, newLeaf: boolean = false): Promise<void> {
        console.log(`[Workspace] openLinkText called for: ${linktext}`);
        const file = this.app.vault.getFileByPath(linktext);

        if (file) {
            // If newLeaf is false, try to find an existing leaf for this file.
            let leaf = newLeaf ? undefined : this.leaves.find(l => l.view?.file?.path === file.path);

            if (!leaf) {
                leaf = this.getLeaf(true); // getLeaf will create a new leaf instance
                leaf.view = new MarkdownView(leaf);
                leaf.view.file = file;
            }
            
            leaf.view.editor.setValue(await this.app.vault.read(file));
            this.setActiveLeaf(leaf); // This will set activeLeaf and emit the change event
            
            this.emit('file-open', file); // Keep this for legacy or other listeners
        } else {
            console.error(`File not found: ${linktext}`);
        }
    }

    getActiveFile(): TFile | null {
        // This is now the single source of truth for the active file, derived
        // from the active leaf's view. This resolves the core state bug.
        if (this.activeLeaf && this.activeLeaf.getViewState().type === 'markdown') {
            return (this.activeLeaf.view as MarkdownView).file;
        }
        return null;
    }

    getLeavesOfType(viewType: string) {
        return this.leaves.filter(leaf => leaf.view.getViewType() === viewType);
    }

    // This method is now more generic to get a leaf, optionally creating one.
    getLeaf(create: boolean = false): WorkspaceLeaf {
        // In this mock, we'll just create a new leaf if requested.
        // A real implementation would have more complex logic for splitting, etc.
        if (create) {
            const editorContainer = document.querySelector('.editor-container');
            if (editorContainer) {
                const leafContainer = document.createElement('div');
                leafContainer.classList.add('workspace-leaf-content');
                // Note: We don't append it here because the React UI will manage the DOM rendering
                const newLeaf = new WorkspaceLeaf(this.app, leafContainer as HTMLElement);
                this.leaves.push(newLeaf);
                this.setActiveLeaf(newLeaf);
                return newLeaf;
            } else {
                throw new Error("Could not find '.editor-container' to create a leaf.");
            }
        }
        return this.activeLeaf ?? this.leaves[0];
    }
    
    setActiveLeaf(leaf: WorkspaceLeaf) {
        if (this.activeLeaf !== leaf) {
            this.activeLeaf = leaf;
            this.emit('active-leaf-change', leaf);
        }
    }

    detachLeaf(leaf: WorkspaceLeaf) {
        const index = this.leaves.findIndex(l => l === leaf);
        if (index > -1) {
            this.leaves.splice(index, 1);
            if (this.activeLeaf === leaf) {
                this.activeLeaf = this.leaves[0] || null;
                this.emit('active-leaf-change', this.activeLeaf);
            }
        }
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

    getActiveViewOfType<T extends ItemView>(type: new (...args: any[]) => T): T | null {
        // This is a simplified mock. It finds the first view of the given type.
        if (this.activeLeaf && this.activeLeaf.view instanceof type) {
            return this.activeLeaf.view as T;
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

        // Do NOT set the activeLeaf here. Revealing a leaf in the sidebar
        // should not steal focus from the main editor pane. This was the
        // root cause of the "No file is currently open" error.
        // this.activeLeaf = leaf;
        
        const rightSidebar = document.querySelector('.right-sidebar');
        if (rightSidebar && !rightSidebar.contains(leaf.containerEl)) {
             // Clear any existing content
            while (rightSidebar.firstChild) {
                rightSidebar.removeChild(rightSidebar.firstChild);
            }
            console.log("[Mock API] Appending leaf container to right sidebar.");
            rightSidebar.appendChild(leaf.containerEl);
        }
        this.emit('layout-change', leaf);
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
    public readonly isPoc: boolean = true; // Flag to identify the POC environment

    // Add missing properties to satisfy the obsidian.App interface
    public keymap: any = {};
    public scope: any = {};
    public metadataCache: any = {
        getTags: () => ({}) // Mock implementation
    };
    public fileManager: any = {};
    public lastEvent: any = null;
    public settingTabs: PluginSettingTab[] = [];
    public setting: any = {
      activeTab: null,
    };
    public plugins: any = {
        plugins: {},
    };

    constructor() {
        this.vault = new Vault();
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

    getCommands(): any[] {
        return this.commands;
    }

    addSettingTab(tab: PluginSettingTab) {
        const tabExists = this.settingTabs.some(
            (existingTab) => existingTab.id === tab.id && existingTab.name === tab.name,
        );

        if (!tabExists) {
            this.settingTabs.push(tab);
        }
        // In a real app, this would also handle displaying it in the settings UI.
        console.log(`[Mock API] Setting tab added: ${tab.constructor.name}`);
    }

    addRibbonIcon(icon: string, title: string, callback: () => void): HTMLElement {
        console.log(`[Mock API] addRibbonIcon: ${title}`);
        const ribbonButton = document.createElement('div');
        ribbonButton.className = 'ribbon-icon';
        ribbonButton.innerHTML = `<i>${icon}</i>`;
        ribbonButton.onclick = callback;
        // In a real app, this would be added to the ribbon
        return ribbonButton;
    }
}

const app = new App();
export { app };

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