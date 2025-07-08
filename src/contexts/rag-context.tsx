import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
} from 'react'

import { RAGEngine } from '../core/rag/ragEngine'
import { usePlugin } from './plugin-context'

export type RAGContextType = {
  getRAGEngine: () => Promise<RAGEngine>
}

const RAGContext = createContext<RAGContextType | null>(null)

export function RAGProvider({
  getRAGEngine,
  children,
}: PropsWithChildren<{ getRAGEngine?: () => Promise<RAGEngine> }>) {
  const plugin = usePlugin()

  // For the web-poc, we provide a null RAGEngine to gracefully disable RAG.
  // Consumers of the context should handle this null case.
  if (plugin.app.isPoc) {
    return (
      <RAGContext.Provider value={null}>{children}</RAGContext.Provider>
    )
  }

  useEffect(() => {
    // start initialization of ragEngine in the background
    if (getRAGEngine) {
      void getRAGEngine()
    }
  }, [getRAGEngine])

  const value = useMemo(() => {
    if (!getRAGEngine) {
      return null
    }
    return { getRAGEngine }
  }, [getRAGEngine])

  return <RAGContext.Provider value={value}>{children}</RAGContext.Provider>
}

export function useRAG() {
  const context = useContext(RAGContext)
  return context
}
