import { ImageIcon } from 'lucide-react'
import styles from './ChatUserInput.module.css'

export function ImageUploadButton({
  onUpload,
}: {
  onUpload: (files: File[]) => void
}) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 0) {
      onUpload(files)
    }
  }

  return (
    <label className={styles.submitButton}>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <div className={styles.submitButtonIcons}>
        <ImageIcon size={12} />
      </div>
      <div>Image</div>
    </label>
  )
}
