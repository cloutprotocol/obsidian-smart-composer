import { ItemView, WorkspaceLeaf } from 'obsidian'
import { Root, createRoot } from 'react-dom/client'

import ApplyViewRoot from './components/apply-view/ApplyViewRoot'
import { APPLY_VIEW_TYPE } from './constants'
import { AppProvider } from './contexts/app-context'
import { PluginProvider } from './contexts/plugin-context'
import { TFile } from 'web-poc/src/lib/obsidian-api'

export type ApplyViewState = {
  file: TFile
  originalContent: string
  newContent: string
  diff: string
}

export class ApplyView extends ItemView {
  private root: Root | null = null
  private viewState: ApplyViewState = {
    file: {} as TFile,
    originalContent: '',
    newContent: '',
    diff: '',
  }

  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
  }

  getViewType() {
    return APPLY_VIEW_TYPE
  }

  getDisplayText() {
    return `Applying: ${this.viewState.file.name}`
  }

  async onOpen() {
    this.root = createRoot(this.containerEl)
    this.render()
  }

  async onClose() {
    this.root?.unmount()
  }

  getState() {
    return this.viewState
  }

  async setState(state: any, options: any) {
    this.viewState = state
    this.render()
    return
  }

  render() {
    if (this.root) {
      this.root.render(
        <AppProvider app={this.app}>
          <PluginProvider
            plugin={
              (this.app as any).plugins.plugins['smart-composer'] as any
            }
          >
            <ApplyViewRoot
              state={this.viewState}
              close={() => this.leaf.detach()}
            />
          </PluginProvider>
        </AppProvider>,
      )
    }
  }
}
