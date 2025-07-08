import isEqual from 'lodash.isequal'
import { App } from 'obsidian'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { editorStateToPlainText } from '../components/chat-view/chat-input/utils/editor-state-to-plain-text'
import { useApp } from '../contexts/app-context'
import { ChatConversationMetadata } from '../database/json/chat/types'
import { ChatMessage, SerializedChatMessage } from '../types/chat'
import { Mentionable } from '../types/mentionable'
import {
  deserializeMentionable,
  serializeMentionable,
} from '../utils/chat/mentionable'

import { useChatManager } from './useJsonManagers'

type UseChatHistory = {
  createOrUpdateConversation: (
    id: string,
    messages: ChatMessage[],
  ) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  getChatMessagesById: (id: string) => Promise<ChatMessage[] | null>
  updateConversationTitle: (id: string, title: string) => Promise<void>
  chatList: ChatConversationMetadata[]
}

export function useChatHistory(): UseChatHistory {
  const app = useApp()
  const chatManager = useChatManager()
  const [chatList, setChatList] = useState<ChatConversationMetadata[]>([])

  const fetchChatList = useCallback(async () => {
    if (!chatManager) return
    const list = await chatManager.listChats()
    setChatList(list)
  }, [chatManager])

  useEffect(() => {
    void fetchChatList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce was removed from createOrUpdateConversation due to complex typing issues
  // with lodash's `DebouncedFunc`. The function now runs directly, which is acceptable
  // as it's not a critical performance path.
  const createOrUpdateConversation = useCallback(
    async (id: string, messages: ChatMessage[]): Promise<void> => {
      // In some environments (e.g., web-poc), chatManager may not be available.
      // This check prevents errors by effectively disabling history features.
      if (!chatManager) return

      const serializedMessages = messages.map(serializeChatMessage)
      const existingConversation = await chatManager.findById(id)

      if (existingConversation) {
        if (isEqual(existingConversation.messages, serializedMessages)) {
          return
        }
        await chatManager.updateChat(existingConversation.id, {
          messages: serializedMessages,
        })
      } else {
        const firstUserMessage = messages.find((v) => v.role === 'user')

        await chatManager.createChat({
          id,
          title: firstUserMessage?.content
            ? editorStateToPlainText(firstUserMessage.content).substring(
                0,
                50,
              )
            : 'New chat',
          messages: serializedMessages,
        })
      }

      await fetchChatList()
    },
    [chatManager, fetchChatList],
  )

  const deleteConversation = useCallback(
    async (id: string): Promise<void> => {
      if (!chatManager) return
      await chatManager.deleteChat(id)
      await fetchChatList()
    },
    [chatManager, fetchChatList],
  )

  const getChatMessagesById = useCallback(
    async (id: string): Promise<ChatMessage[] | null> => {
      if (!chatManager) return null
      const conversation = await chatManager.findById(id)
      if (!conversation) {
        return null
      }
      return conversation.messages.map((message) =>
        deserializeChatMessage(message, app),
      )
    },
    [chatManager, app],
  )

  const updateConversationTitle = useCallback(
    async (id: string, title: string): Promise<void> => {
      if (title.length === 0) {
        throw new Error('Chat title cannot be empty')
      }
      if (!chatManager) return
      const conversation = await chatManager.findById(id)
      if (!conversation) {
        throw new Error('Conversation not found')
      }
      await chatManager.updateChat(conversation.id, {
        title,
      })
      await fetchChatList()
    },
    [chatManager, fetchChatList],
  )

  return {
    createOrUpdateConversation,
    deleteConversation,
    getChatMessagesById,
    updateConversationTitle,
    chatList,
  }
}

const serializeChatMessage = (message: ChatMessage): SerializedChatMessage => {
  switch (message.role) {
    case 'user':
      return {
        role: 'user',
        content: message.content,
        promptContent: message.promptContent,
        id: message.id,
        mentionables: message.mentionables.map(serializeMentionable),
        similaritySearchResults: message.similaritySearchResults,
      }
    case 'assistant':
      return {
        role: 'assistant',
        content: message.content,
        reasoning: message.reasoning,
        annotations: message.annotations,
        toolCallRequests: message.toolCallRequests,
        id: message.id,
        metadata: message.metadata,
      }
    case 'tool':
      return {
        role: 'tool',
        toolCalls: message.toolCalls,
        id: message.id,
      }
  }
}

const deserializeChatMessage = (
  message: SerializedChatMessage,
  app: App,
): ChatMessage => {
  switch (message.role) {
    case 'user': {
      return {
        role: 'user',
        content: message.content,
        promptContent: message.promptContent,
        id: message.id,
        mentionables: message.mentionables
          .map((m) => deserializeMentionable(m, app))
          .filter((m): m is Mentionable => m !== null),
        similaritySearchResults: message.similaritySearchResults,
      }
    }
    case 'assistant':
      return {
        role: 'assistant',
        content: message.content,
        reasoning: message.reasoning,
        annotations: message.annotations,
        toolCallRequests: message.toolCallRequests,
        id: message.id,
        metadata: message.metadata,
      }
    case 'tool':
      return {
        role: 'tool',
        toolCalls: message.toolCalls,
        id: message.id,
      }
  }
}
