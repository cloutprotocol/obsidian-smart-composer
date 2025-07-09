import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

import { useSettings } from '../../../contexts/settings-context'
import styles from './ChatUserInput.module.css'

export function ModelSelect() {
  const { settings, setSettings } = useSettings()
  const [isOpen, setIsOpen] = useState(false)
  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        <button className={styles.modelSelect}>
          <div className={styles.modelSelectName}>
            {settings.chatModelId}
          </div>
          <div className={styles.modelSelectIcon}>
            {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="smtcmp-popover">
          <ul>
            {settings.chatModels
              .filter(({ enable }) => enable ?? true)
              .map((chatModelOption) => (
                <DropdownMenu.Item
                  key={chatModelOption.id}
                  onSelect={() => {
                    setSettings({
                      ...settings,
                      chatModelId: chatModelOption.id,
                    })
                  }}
                  asChild
                >
                  <li>{chatModelOption.id}</li>
                </DropdownMenu.Item>
              ))}
          </ul>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
