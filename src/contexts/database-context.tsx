import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'

import { DatabaseManager } from '../database/DatabaseManager'
import { TemplateManager } from '../database/modules/template/TemplateManager'
import { VectorManager } from '../database/modules/vector/VectorManager'
import { usePlugin } from './plugin-context'

type DatabaseContextType = {
  getDatabaseManager: () => Promise<DatabaseManager>
  getVectorManager: () => Promise<VectorManager>
  getTemplateManager: () => Promise<TemplateManager>
}

const DatabaseContext = createContext<DatabaseContextType | null>(null)

export function DatabaseProvider({
  children,
  getDatabaseManager,
}: {
  children: React.ReactNode
  getDatabaseManager?: () => Promise<DatabaseManager>
}) {
  const plugin = usePlugin()

  // For the web-poc, we provide a null DatabaseManager to gracefully disable database features.
  // Consumers of the context should handle this null case.
  if (plugin.app.isPoc) {
    return (
      <DatabaseContext.Provider value={null}>
        {children}
      </DatabaseContext.Provider>
    )
  }

  const getVectorManager = useCallback(async () => {
    if (!getDatabaseManager) throw new Error('DatabaseManager not available')
    return (await getDatabaseManager()).getVectorManager()
  }, [getDatabaseManager])

  const getTemplateManager = useCallback(async () => {
    if (!getDatabaseManager) throw new Error('DatabaseManager not available')
    return (await getDatabaseManager()).getTemplateManager()
  }, [getDatabaseManager])

  useEffect(() => {
    // start initialization of dbManager in the background
    if (getDatabaseManager) {
      void getDatabaseManager()
    }
  }, [getDatabaseManager])

  const value = useMemo(() => {
    if (!getDatabaseManager) {
      return null
    }
    return { getDatabaseManager, getVectorManager, getTemplateManager }
  }, [getDatabaseManager, getVectorManager, getTemplateManager])

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase(): DatabaseContextType | null {
  const context = useContext(DatabaseContext)
  return context
}
