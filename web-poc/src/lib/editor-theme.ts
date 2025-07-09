/**
 * @fileoverview
 * This file defines custom CodeMirror themes for the Smart Composer application.
 * It uses the `@uiw/codemirror-themes` library to create themes that match
 * the application's light and dark modes, including the glassmorphism effect.
 */

import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';

// Shared settings for both themes to ensure a consistent look
const sharedSettings = {
  background: 'transparent', // Crucial for glassmorphism
  gutterBackground: 'transparent',
  fontFamily: 'var(--font-family)',
};

// --- Dark Theme ---
export const smartComposerDark = createTheme({
  theme: 'dark',
  settings: {
    ...sharedSettings,
    foreground: '#d4d4d4',
    caret: '#0a84ff',
    selection: 'rgba(10, 132, 255, 0.2)',
    selectionMatch: 'rgba(10, 132, 255, 0.1)',
    lineHighlight: 'rgba(255, 255, 255, 0.05)',
    gutterForeground: 'rgba(255, 255, 255, 0.4)',
    gutterBorder: 'none',
  },
  styles: [
    { tag: t.comment, color: '#7f848e' },
    { tag: t.variableName, color: '#d4d4d4' },
    { tag: [t.string, t.special(t.brace)], color: '#ce9178' },
    { tag: t.number, color: '#b5cea8' },
    { tag: t.bool, color: '#569cd6' },
    { tag: t.null, color: '#569cd6' },
    { tag: t.keyword, color: '#c586c0' },
    { tag: t.operator, color: '#d4d4d4' },
    { tag: t.className, color: '#4ec9b0' },
    { tag: t.definition(t.typeName), color: '#4ec9b0' },
    { tag: t.typeName, color: '#4ec9b0' },
    { tag: t.angleBracket, color: '#569cd6' },
    { tag: t.tagName, color: '#569cd6' },
    { tag: t.attributeName, color: '#9cdcfe' },
  ],
});


// --- Light Theme ---
export const smartComposerLight = createTheme({
  theme: 'light',
  settings: {
    ...sharedSettings,
    background: '#f2f2f7', // Explicitly set light background
    gutterBackground: '#f2f2f7', // Match gutter to background
    foreground: '#24292e',
    caret: '#007aff',
    selection: 'rgba(0, 122, 255, 0.15)',
    selectionMatch: 'rgba(0, 122, 255, 0.1)',
    lineHighlight: 'rgba(0, 0, 0, 0.03)',
    gutterForeground: 'rgba(0, 0, 0, 0.4)',
    gutterBorder: 'none',
  },
  styles: [
    { tag: t.comment, color: '#6a737d' },
    { tag: t.variableName, color: '#24292e' },
    { tag: [t.string, t.special(t.brace)], color: '#032f62' },
    { tag: t.number, color: '#005cc5' },
    { tag: t.bool, color: '#d73a49' },
    { tag: t.null, color: '#d73a49' },
    { tag: t.keyword, color: '#d73a49' },
    { tag: t.operator, color: '#d73a49' },
    { tag: t.className, color: '#6f42c1' },
    { tag: t.definition(t.typeName), color: '#6f42c1' },
    { tag: t.typeName, color: '#6f42c1' },
    { tag: t.angleBracket, color: '#24292e' },
    { tag: t.tagName, color: '#22863a' },
    { tag: t.attributeName, color: '#6f42c1' },
  ],
}); 