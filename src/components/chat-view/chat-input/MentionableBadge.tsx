import clsx from 'clsx';
import { Eye, EyeOff, X } from 'lucide-react';
import { PropsWithChildren } from 'react';

import { useSettings } from '../../../contexts/settings-context';
import {
  Mentionable,
  MentionableBlock,
  MentionableCurrentFile,
  MentionableFile,
  MentionableFolder,
  MentionableImage,
  MentionableUrl,
  MentionableVault,
} from '../../../types/mentionable';

import { getMentionableIcon } from './utils/get-metionable-icon';

export type BadgeStyleProps = {
  className?: string;
  deleteClassName?: string;
  previewClassName?: string;
  nameClassName?: string;
  nameIconClassName?: string;
  nameSuffixClassName?: string;
  currentClassName?: string;
  excludedContentClassName?: string;
};

function BadgeBase({
  children,
  onDelete,
  onClick,
  className,
  deleteClassName,
}: PropsWithChildren<{
  onDelete: () => void;
  onClick: () => void;
  className?: string;
  deleteClassName?: string;
}>) {
  return (
    <div className={className} onClick={onClick}>
      {children}
      <div
        className={deleteClassName}
        onClick={(evt) => {
          evt.stopPropagation();
          onDelete();
        }}
      >
        <X size={12} />
      </div>
    </div>
  );
}

type BadgeProps<T extends Mentionable> = {
  mentionable: T;
  onDelete: () => void;
  onClick: () => void;
  isFocused: boolean;
} & BadgeStyleProps;

function FileBadge({ mentionable, onDelete, onClick, ...rest }: BadgeProps<MentionableFile>) {
  const Icon = getMentionableIcon(mentionable);
  return (
    <BadgeBase
      onDelete={onDelete}
      onClick={onClick}
      className={rest.className}
      deleteClassName={rest.deleteClassName}
    >
      <div className={rest.nameClassName}>
        {Icon && <Icon size={12} className={rest.nameIconClassName} />}
        <span>{mentionable.file.name}</span>
      </div>
    </BadgeBase>
  );
}

function FolderBadge({ mentionable, onDelete, onClick, ...rest }: BadgeProps<MentionableFolder>) {
  const Icon = getMentionableIcon(mentionable);
  return (
    <BadgeBase
      onDelete={onDelete}
      onClick={onClick}
      className={rest.className}
      deleteClassName={rest.deleteClassName}
    >
      <div className={rest.nameClassName}>
        {Icon && <Icon size={12} className={rest.nameIconClassName} />}
        <span>{mentionable.folder.name}</span>
      </div>
    </BadgeBase>
  );
}

function VaultBadge({ onDelete, onClick, ...rest }: BadgeProps<MentionableVault>) {
  const Icon = getMentionableIcon(rest.mentionable);
  return (
    <BadgeBase
      onDelete={onDelete}
      onClick={onClick}
      className={rest.className}
      deleteClassName={rest.deleteClassName}
    >
      <div className={rest.nameClassName}>
        {Icon && <Icon size={12} className={rest.nameIconClassName} />}
        <span>Vault</span>
      </div>
    </BadgeBase>
  );
}

function CurrentFileBadge({
  mentionable,
  onDelete,
  onClick,
  ...rest
}: BadgeProps<MentionableCurrentFile>) {
  const { settings, setSettings } = useSettings();

  const handleCurrentFileToggle = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setSettings({
      ...settings,
      chatOptions: {
        ...settings.chatOptions,
        includeCurrentFileContent: !settings.chatOptions.includeCurrentFileContent,
      },
    });
  };

  const Icon = getMentionableIcon(mentionable);
  return mentionable.file ? (
    <BadgeBase
      onDelete={onDelete}
      onClick={onClick}
      className={rest.className}
      deleteClassName={rest.deleteClassName}
    >
      <div className={rest.nameClassName}>
        {Icon && <Icon size={12} className={rest.nameIconClassName} />}
        <span
          className={clsx(
            !settings.chatOptions.includeCurrentFileContent &&
              rest.excludedContentClassName,
          )}
        >
          {mentionable.file.name}
        </span>
      </div>
      <div
        className={clsx(
          rest.nameSuffixClassName,
          !settings.chatOptions.includeCurrentFileContent &&
            rest.excludedContentClassName,
        )}
      >
        {' (Current File)'}
      </div>
      <div className={rest.previewClassName} onClick={handleCurrentFileToggle}>
        {settings.chatOptions.includeCurrentFileContent ? (
          <Eye size={12} />
        ) : (
          <EyeOff size={12} />
        )}
      </div>
    </BadgeBase>
  ) : null;
}

function BlockBadge({ mentionable, onDelete, onClick, ...rest }: BadgeProps<MentionableBlock>) {
  const Icon = getMentionableIcon(mentionable);
  return (
    <BadgeBase
      onDelete={onDelete}
      onClick={onClick}
      className={rest.className}
      deleteClassName={rest.deleteClassName}
    >
      <div className={rest.nameClassName}>
        {Icon && <Icon size={12} className={rest.nameIconClassName} />}
        <span>{mentionable.file.name}</span>
      </div>
      <div className={rest.nameSuffixClassName}>
        {` (${mentionable.startLine}:${mentionable.endLine})`}
      </div>
    </BadgeBase>
  );
}

function UrlBadge({ mentionable, onDelete, onClick, ...rest }: BadgeProps<MentionableUrl>) {
  const Icon = getMentionableIcon(mentionable);
  return (
    <BadgeBase
      onDelete={onDelete}
      onClick={onClick}
      className={rest.className}
      deleteClassName={rest.deleteClassName}
    >
      <div className={rest.nameClassName}>
        {Icon && <Icon size={12} className={rest.nameIconClassName} />}
        <span>{mentionable.url}</span>
      </div>
    </BadgeBase>
  );
}

function ImageBadge({ mentionable, onDelete, onClick, ...rest }: BadgeProps<MentionableImage>) {
  const Icon = getMentionableIcon(mentionable);
  return (
    <BadgeBase
      onDelete={onDelete}
      onClick={onClick}
      className={rest.className}
      deleteClassName={rest.deleteClassName}
    >
      <div className={rest.nameClassName}>
        {Icon && <Icon size={12} className={rest.nameIconClassName} />}
        <span>{mentionable.fileName}</span>
      </div>
    </BadgeBase>
  );
}

export default function MentionableBadge(props: BadgeProps<Mentionable>) {
  switch (props.mentionable.type) {
    case 'file':
      return <FileBadge {...(props as BadgeProps<MentionableFile>)} />;
    case 'folder':
      return <FolderBadge {...(props as BadgeProps<MentionableFolder>)} />;
    case 'vault':
      return <VaultBadge {...(props as BadgeProps<MentionableVault>)} />;
    case 'current-file':
      return <CurrentFileBadge {...(props as BadgeProps<MentionableCurrentFile>)} />;
    case 'block':
      return <BlockBadge {...(props as BadgeProps<MentionableBlock>)} />;
    case 'url':
      return <UrlBadge {...(props as BadgeProps<MentionableUrl>)} />;
    case 'image':
      return <ImageBadge {...(props as BadgeProps<MentionableImage>)} />;
    default:
      return null;
  }
}
