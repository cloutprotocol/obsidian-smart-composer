import 'obsidian';

declare module 'obsidian' {
  interface App {
    isPoc?: boolean;
  }
} 