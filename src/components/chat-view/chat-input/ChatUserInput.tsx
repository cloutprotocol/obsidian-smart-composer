import { useQuery } from '@tanstack/react-query';
import { $nodesOfType, LexicalEditor, SerializedEditorState } from 'lexical';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useApp } from '../../../contexts/app-context';
import {
  Mentionable,
  MentionableImage,
  SerializedMentionable,
} from '../../../types/mentionable';
import { classNames } from '../../../utils/common/classnames';
import {
  deserializeMentionable,
  getMentionableKey,
  serializeMentionable,
} from '../../../utils/chat/mentionable';
import { fileToMentionableImage } from '../../../utils/llm/image';
import { openMarkdownFile, readTFileContent } from '../../../utils/obsidian';
import { ObsidianMarkdown } from '../ObsidianMarkdown';

import styles from './ChatUserInput.module.css';
import { ImageUploadButton } from './ImageUploadButton';
import LexicalContentEditable from './LexicalContentEditable';
import MentionableBadge from './MentionableBadge';
import { ModelSelect } from './ModelSelect';
import { MentionNode } from './plugins/mention/MentionNode';
import { NodeMutations } from './plugins/on-mutation/OnMutationPlugin';
import { SubmitButton } from './SubmitButton';
import ToolBadge from './ToolBadge';
import { VaultChatButton } from './VaultChatButton';

export type ChatUserInputRef = {
  focus: () => void;
};

export type ChatUserInputProps = {
  initialSerializedEditorState: SerializedEditorState | null;
  onChange: (content: SerializedEditorState) => void;
  onSubmit: (content: SerializedEditorState, useVaultSearch?: boolean) => void;
  onFocus: () => void;
  mentionables: Mentionable[];
  setMentionables: (mentionables: Mentionable[]) => void;
  autoFocus?: boolean;
  addedBlockKey?: string | null;
};

const ChatUserInput = forwardRef<ChatUserInputRef, ChatUserInputProps>(
  (
    {
      initialSerializedEditorState,
      onChange,
      onSubmit,
      onFocus,
      mentionables,
      setMentionables,
      autoFocus = false,
      addedBlockKey,
    },
    ref,
  ) => {
    const app = useApp();

    const editorRef = useRef<LexicalEditor | null>(null);
    const contentEditableRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [displayedMentionableKey, setDisplayedMentionableKey] = useState<
      string | null
    >(addedBlockKey ?? null);

    useEffect(() => {
      if (addedBlockKey) {
        setDisplayedMentionableKey(addedBlockKey);
      }
    }, [addedBlockKey]);

    useImperativeHandle(ref, () => ({
      focus: () => {
        contentEditableRef.current?.focus();
      },
    }));

    const handleMentionNodeMutation = (
      mutations: NodeMutations<MentionNode>,
    ) => {
      const destroyedMentionableKeys: string[] = [];
      const addedMentionables: SerializedMentionable[] = [];
      mutations.forEach((mutation) => {
        const mentionable = mutation.node.getMentionable();
        const mentionableKey = getMentionableKey(mentionable);

        if (mutation.mutation === 'destroyed') {
          const nodeWithSameMentionable = editorRef.current?.read(() =>
            $nodesOfType(MentionNode).find(
              (node) =>
                getMentionableKey(node.getMentionable()) === mentionableKey,
            ),
          );

          if (!nodeWithSameMentionable) {
            // remove mentionable only if it's not present in the editor state
            destroyedMentionableKeys.push(mentionableKey);
          }
        } else if (mutation.mutation === 'created') {
          if (
            mentionables.some(
              (m) =>
                getMentionableKey(serializeMentionable(m)) === mentionableKey,
            ) ||
            addedMentionables.some(
              (m) => getMentionableKey(m) === mentionableKey,
            )
          ) {
            // do nothing if mentionable is already added
            return;
          }

          addedMentionables.push(mentionable);
        }
      });

      setMentionables(
        mentionables
          .filter(
            (m) =>
              !destroyedMentionableKeys.includes(
                getMentionableKey(serializeMentionable(m)),
              ),
          )
          .concat(
            addedMentionables
              .map((m) => deserializeMentionable(m, app))
              .filter((v) => !!v) as Mentionable[],
          ),
      );
      if (addedMentionables.length > 0) {
        setDisplayedMentionableKey(
          getMentionableKey(addedMentionables[addedMentionables.length - 1]),
        );
      }
    };

    const handleCreateImageMentionables = useCallback(
      (mentionableImages: MentionableImage[]) => {
        const newMentionableImages = mentionableImages.filter(
          (m) =>
            !mentionables.some(
              (mentionable) =>
                getMentionableKey(serializeMentionable(mentionable)) ===
                getMentionableKey(serializeMentionable(m)),
            ),
        );
        if (newMentionableImages.length === 0) return;
        setMentionables([...mentionables, ...newMentionableImages]);
        setDisplayedMentionableKey(
          getMentionableKey(
            serializeMentionable(
              newMentionableImages[newMentionableImages.length - 1],
            ),
          ),
        );
      },
      [mentionables, setMentionables],
    );

    const handleMentionableDelete = (mentionable: Mentionable) => {
      const mentionableKey = getMentionableKey(
        serializeMentionable(mentionable),
      );
      setMentionables(
        mentionables.filter(
          (m) => getMentionableKey(serializeMentionable(m)) !== mentionableKey,
        ),
      );

      editorRef.current?.update(() => {
        $nodesOfType(MentionNode).forEach((node) => {
          if (getMentionableKey(node.getMentionable()) === mentionableKey) {
            node.remove();
          }
        });
      });
    };

    const handleUploadImages = async (images: File[]) => {
      const mentionableImages = await Promise.all(
        images.map((image) => fileToMentionableImage(image)),
      );
      handleCreateImageMentionables(mentionableImages);
    };

    const handleSubmit = (options: { useVaultSearch?: boolean } = {}) => {
      const content = editorRef.current?.getEditorState()?.toJSON();
      content && onSubmit(content, options.useVaultSearch);
    };

    return (
      <div className={styles.chatUserInputContainer} ref={containerRef}>
        <div className={styles.chatUserInputFiles}>
          <ToolBadge />
          {mentionables.map((m) => {
            const mentionableKey = getMentionableKey(serializeMentionable(m));
            const isFocused = mentionableKey === displayedMentionableKey;
            return (
              <MentionableBadge
                key={mentionableKey}
                mentionable={m}
                onDelete={() => handleMentionableDelete(m)}
                onClick={() => {
                  if (
                    (m.type === 'current-file' ||
                      m.type === 'file' ||
                      m.type === 'block') &&
                    m.file &&
                    isFocused
                  ) {
                    // open file on click again
                    openMarkdownFile(
                      app,
                      m.file.path,
                      m.type === 'block' ? m.startLine : undefined,
                    );
                  } else {
                    setDisplayedMentionableKey(mentionableKey);
                  }
                }}
                isFocused={isFocused}
                className={classNames(
                  styles.fileBadge,
                  isFocused && styles.fileBadgeFocused,
                )}
                deleteClassName={styles.deleteButton}
                previewClassName={styles.previewButton}
                nameClassName={styles.badgeName}
                nameIconClassName={styles.badgeNameIcon}
                nameSuffixClassName={styles.badgeNameSuffix}
                currentClassName={styles.badgeCurrent}
                excludedContentClassName={styles.excludedContent}
              />
            );
          })}
        </div>

        <MentionableContentPreview
          displayedMentionableKey={displayedMentionableKey}
          mentionables={mentionables}
        />

        <LexicalContentEditable
          initialEditorState={(editor) => {
            if (initialSerializedEditorState) {
              editor.setEditorState(
                editor.parseEditorState(initialSerializedEditorState),
              );
            }
          }}
          className={styles.lexicalRoot}
          paragraphClassName={styles.lexicalParagraph}
          editorRef={editorRef}
          contentEditableRef={contentEditableRef}
          onChange={onChange}
          onFocus={onFocus}
          onEnter={() => {
            handleSubmit();
          }}
          onMentionNodeMutation={handleMentionNodeMutation}
          onCreateImageMentionables={handleCreateImageMentionables}
          autoFocus={autoFocus}
        />

        <div className={styles.chatUserInputControls}>
          <div className={styles.modelSelectContainer}>
            <ModelSelect />
          </div>
          <div className={styles.buttons}>
            <ImageUploadButton onUpload={handleUploadImages} />
            <VaultChatButton
              onClick={() => handleSubmit({ useVaultSearch: true })}
            />
            <SubmitButton onClick={() => handleSubmit()} />
          </div>
        </div>
      </div>
    );
  },
);

ChatUserInput.displayName = 'ChatUserInput';

function MentionableContentPreview({
  displayedMentionableKey,
  mentionables,
}: {
  displayedMentionableKey: string | null;
  mentionables: Mentionable[];
}) {
  const app = useApp();

  const displayedMentionable = useMemo(() => {
    if (!displayedMentionableKey) return null;
    return (
      mentionables.find(
        (m) =>
          getMentionableKey(serializeMentionable(m)) === displayedMentionableKey,
      ) ?? null
    );
  }, [displayedMentionableKey, mentionables]);

  const { data: content, isLoading } = useQuery({
    queryKey: ['mentionable-content', displayedMentionableKey],
    queryFn: async () => {
      if (!displayedMentionable) return '';
      if (
        (displayedMentionable.type === 'file' ||
          displayedMentionable.type === 'current-file') &&
        displayedMentionable.file
      ) {
        return readTFileContent(displayedMentionable.file, app.vault);
      }
      if (displayedMentionable.type === 'block') {
        return displayedMentionable.content;
      }
      return '';
    },
    enabled: !!displayedMentionable,
  });

  if (!displayedMentionable) return null;

  return (
    <div className={styles.contentPreview}>
      {isLoading ? (
        'Loading...'
      ) : displayedMentionable.type === 'image' ? (
        <img
          src={`data:${displayedMentionable.mimeType};base64,${displayedMentionable.data}`}
          alt={displayedMentionable.name}
        />
      ) : (
        <ObsidianMarkdown content={content ?? ''} />
      )}
    </div>
  );
}

export default ChatUserInput;
