import { App, PluginSettingTab } from 'obsidian'
import { Root, createRoot } from 'react-dom/client'

import { SettingsTabRoot } from '../components/settings/SettingsTabRoot'
import { SettingsProvider } from '../contexts/settings-context'
import SmartComposerPlugin from '../main'

export class SmartComposerSettingTab extends PluginSettingTab {
  plugin: SmartComposerPlugin
  private root: Root | null = null

  constructor(app: App, plugin: SmartComposerPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    this.root = createRoot(containerEl)
    this.root.render(
      <SettingsProvider
        settings={this.plugin.settings}
        setSettings={(newSettings) => this.plugin.setSettings(newSettings)}
        addSettingsChangeListener={(listener) =>
          this.plugin.addSettingsChangeListener(listener)
        }
      >
        <SettingsTabRoot app={this.app} plugin={this.plugin} />
      </SettingsProvider>,
    )
  }

  hide(): void {
    if (this.root) {
      // Defer the unmount to avoid a race condition where React tries to
      // unmount a component tree while it's still in the middle of a render.
      // This is a common issue when integrating React with non-React libraries
      // or in environments like Obsidian's settings tabs.
      setTimeout(() => {
        this.root?.unmount()
        this.root = null
      }, 0)
    }
  }
}
