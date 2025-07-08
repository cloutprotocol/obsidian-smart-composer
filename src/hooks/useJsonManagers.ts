import { useMemo } from 'react'

import { useApp } from '../contexts/app-context'
import { ChatManager } from '../database/json/chat/ChatManager'
import { TemplateManager } from '../database/json/template/TemplateManager'

export function useTemplateManager(): TemplateManager | null {
  const app = useApp()
  // The web-poc uses a mock app object that doesn't have a fully functional vault.
  // We return null to disable JSON-based features and prevent errors.
  return useMemo(() => (app.isPoc ? null : new TemplateManager(app)), [app])
}

export function useChatManager(): ChatManager | null {
  const app = useApp()
  // The web-poc uses a mock app object that doesn't have a fully functional vault.
  // We return null to disable JSON-based features and prevent errors.
  return useMemo(() => (app.isPoc ? null : new ChatManager(app)), [app])
}
