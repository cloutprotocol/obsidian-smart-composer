import { CornerDownLeftIcon } from 'lucide-react'
import styles from './ChatUserInput.module.css'

export function SubmitButton({ onClick }: { onClick: () => void }) {
  return (
    <div className={styles.submitButton} onClick={onClick}>
      <div className={styles.submitButtonIcons}>
        <CornerDownLeftIcon size={12} />
      </div>
      <div>Chat</div>
    </div>
  )
}
