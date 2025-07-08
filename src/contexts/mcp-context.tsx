import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
} from 'react'

import { McpManager } from '../core/mcp/mcpManager'
import { usePlugin } from './plugin-context'

export type McpContextType = {
  getMcpManager: () => Promise<McpManager>
}

const McpContext = createContext<McpContextType | null>(null)

export function McpProvider({
  getMcpManager,
  children,
}: PropsWithChildren<{ getMcpManager?: () => Promise<McpManager> }>) {
  const plugin = usePlugin()

  // For the web-poc, we provide a null McpManager to gracefully disable MCP.
  // Consumers of the context should handle this null case.
  if (plugin.app.isPoc) {
    return <McpContext.Provider value={null}>{children}</McpContext.Provider>
  }

  useEffect(() => {
    if (getMcpManager) {
      void getMcpManager()
    }
  }, [getMcpManager])

  const value = useMemo(() => {
    if (!getMcpManager) {
      return null
    }
    return { getMcpManager }
  }, [getMcpManager])

  return <McpContext.Provider value={value}>{children}</McpContext.Provider>
}

export function useMcp() {
  const context = useContext(McpContext)
  return context
}
