import clsx from 'clsx'
import { Eye, EyeOff, Wrench } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import styles from './ChatUserInput.module.css'

import { useApp } from '../../../contexts/app-context'
import { useMcp } from '../../../contexts/mcp-context'
import { usePlugin } from '../../../contexts/plugin-context'
import { useSettings } from '../../../contexts/settings-context'
import { McpManager } from '../../../core/mcp/mcpManager'
import { McpSectionModal } from '../../modals/McpSectionModal'

export default function ToolBadge() {
  const plugin = usePlugin()
  const app = useApp()
  const { settings, setSettings } = useSettings()
  const { getMcpManager } = useMcp() || {}

  const [mcpManager, setMcpManager] = useState<McpManager | null>(null)
  const [toolCount, setToolCount] = useState(0)

  const handleBadgeClick = useCallback(() => {
    new McpSectionModal(app, plugin).open()
  }, [plugin, app])

  const handleToolToggle = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      setSettings({
        ...settings,
        chatOptions: {
          ...settings.chatOptions,
          enableTools: !settings.chatOptions.enableTools,
        },
      })
    },
    [settings, setSettings],
  )

  useEffect(() => {
    if (!getMcpManager) {
      setToolCount(0)
      return
    }
    const initMCPManager = async () => {
      const mcpManager = await getMcpManager()
      setMcpManager(mcpManager)

      const tools = await mcpManager.listAvailableTools()
      setToolCount(tools.length)
    }
    initMCPManager()
  }, [getMcpManager])

  useEffect(() => {
    if (mcpManager) {
      const unsubscribe = mcpManager.subscribeServersChange(
        async (_servers) => {
          const tools = await mcpManager.listAvailableTools()
          setToolCount(tools.length)
        },
      )
      return () => {
        unsubscribe()
      }
    }
  }, [mcpManager])

  return (
    <div
      className={styles.fileBadge}
      onClick={handleBadgeClick}
    >
      <div className={styles.badgeName}>
        <Wrench
          size={12}
          className={styles.badgeNameIcon}
        />
        <span
          className={clsx(
            !settings.chatOptions.enableTools && styles.excludedContent,
          )}
        >
          Tools ({toolCount})
        </span>
      </div>
      <div
        className={styles.previewButton}
        onClick={handleToolToggle}
      >
        {settings.chatOptions.enableTools ? (
          <Eye size={12} />
        ) : (
          <EyeOff size={12} />
        )}
      </div>
    </div>
  )
}
