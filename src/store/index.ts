import { create } from 'zustand'
import type { VaultEntry, NoteContent, EditorMode, Theme, ColorScheme, SearchResult } from '../types'
import { saveConfig } from '../lib/fileManager'

export interface TabEntry {
  filePath: string
  title: string
  content: NoteContent
  isDirty: boolean
}

interface AppState {
  // Vault
  vaultPath: string | null
  entries: VaultEntry[]
  setVaultPath: (path: string | null) => void
  setEntries: (entries: VaultEntry[]) => void

  // Open tabs
  openTabs: TabEntry[]
  activeTabIndex: number
  openFile: (filePath: string, content: NoteContent) => void
  closeTab: (index: number) => void
  setActiveTab: (index: number) => void
  updateTabContent: (content: NoteContent) => void
  markTabDirty: (dirty: boolean) => void

  // Editor
  editorMode: EditorMode
  setEditorMode: (mode: EditorMode) => void

  // Theme
  theme: Theme
  colorScheme: ColorScheme
  toggleTheme: () => void
  setColorScheme: (scheme: ColorScheme) => void

  // UI state
  sidebarWidth: number
  previewWidth: number
  showSearch: boolean
  showAIPanel: boolean
  setSidebarWidth: (w: number) => void
  setPreviewWidth: (w: number) => void
  setShowSearch: (s: boolean) => void
  setShowAIPanel: (s: boolean) => void

  // Search
  searchQuery: string
  searchResults: SearchResult[]
  setSearchQuery: (q: string) => void
  setSearchResults: (r: SearchResult[]) => void

  // Tags filter
  selectedTag: string | null
  setSelectedTag: (t: string | null) => void
  allTags: string[]
  setAllTags: (tags: string[]) => void

  // Find in note
  findInNoteTrigger: number
  triggerFindInNote: () => void

  // Settings
  fontSize: number
  tabSize: number
  autosaveEnabled: boolean
  autosaveInterval: number
  setFontSize: (n: number) => void
  setTabSize: (n: number) => void
  setAutosaveEnabled: (b: boolean) => void
  setAutosaveInterval: (n: number) => void
  hydrateFromConfig: (config: Record<string, unknown>) => void
  persistConfig: () => Promise<void>
}

function titleFromPath(filePath: string): string {
  return filePath.replace(/\\/g, '/').split('/').pop()?.replace(/\.md$/, '') || ''
}

export const useStore = create<AppState>((set, get) => ({
  // Vault
  vaultPath: null,
  entries: [],
  setVaultPath: (path) => set({ vaultPath: path, openTabs: [], activeTabIndex: -1 }),
  setEntries: (entries) => set({ entries }),

  // Open tabs
  openTabs: [],
  activeTabIndex: -1,

  openFile: (filePath, content) =>
    set((state) => {
      const existing = state.openTabs.findIndex((t) => t.filePath === filePath)
      if (existing >= 0) {
        return { activeTabIndex: existing }
      }
      const title = titleFromPath(filePath)
      return {
        openTabs: [...state.openTabs, { filePath, title, content, isDirty: false }],
        activeTabIndex: state.openTabs.length,
      }
    }),

  closeTab: (index) =>
    set((state) => {
      const newTabs = state.openTabs.filter((_, i) => i !== index)
      let newIndex = state.activeTabIndex
      if (newIndex >= newTabs.length) {
        newIndex = newTabs.length - 1
      }
      if (newIndex < 0) newIndex = -1
      return { openTabs: newTabs, activeTabIndex: newIndex }
    }),

  setActiveTab: (index) => set({ activeTabIndex: index }),

  updateTabContent: (content) =>
    set((state) => {
      const tabs = [...state.openTabs]
      if (state.activeTabIndex >= 0 && state.activeTabIndex < tabs.length) {
        tabs[state.activeTabIndex] = { ...tabs[state.activeTabIndex], content }
      }
      return { openTabs: tabs }
    }),

  markTabDirty: (dirty) =>
    set((state) => {
      const tabs = [...state.openTabs]
      if (state.activeTabIndex >= 0 && state.activeTabIndex < tabs.length) {
        tabs[state.activeTabIndex] = { ...tabs[state.activeTabIndex], isDirty: dirty }
      }
      return { openTabs: tabs }
    }),

  // Editor
  editorMode: 'split',
  setEditorMode: (mode) => set({ editorMode: mode }),

  // Theme
  theme: (() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  })(),
  colorScheme: 'default',
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      return { theme: next }
    }),
  setColorScheme: (scheme) => set({ colorScheme: scheme }),

  // UI
  sidebarWidth: 260,
  previewWidth: 400,
  showSearch: false,
  showAIPanel: false,
  setSidebarWidth: (w) => set({ sidebarWidth: w }),
  setPreviewWidth: (w) => set({ previewWidth: w }),
  setShowSearch: (s) => set({ showSearch: s }),
  setShowAIPanel: (s) => set({ showAIPanel: s }),

  // Search
  searchQuery: '',
  searchResults: [],
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchResults: (r) => set({ searchResults: r }),

  // Tags
  selectedTag: null,
  setSelectedTag: (t) => set({ selectedTag: t }),
  allTags: [],
  setAllTags: (tags) => set({ allTags: tags }),

  // Find in note
  findInNoteTrigger: 0,
  triggerFindInNote: () => set((s) => ({ findInNoteTrigger: s.findInNoteTrigger + 1 })),

  // Settings
  fontSize: 14,
  tabSize: 2,
  autosaveEnabled: true,
  autosaveInterval: 2000,
  setFontSize: (n) => set({ fontSize: n }),
  setTabSize: (n) => set({ tabSize: n }),
  setAutosaveEnabled: (b) => set({ autosaveEnabled: b }),
  setAutosaveInterval: (n) => set({ autosaveInterval: n }),
  hydrateFromConfig: (config) =>
    set((state) => ({
      vaultPath: (config.vaultPath as string) ?? state.vaultPath,
      theme: (config.theme as Theme) ?? state.theme,
      colorScheme: (config.colorScheme as ColorScheme) ?? state.colorScheme,
      sidebarWidth: (config.sidebarWidth as number) ?? state.sidebarWidth,
      editorMode: (config.editorMode as EditorMode) ?? state.editorMode,
      fontSize: (config.fontSize as number) ?? 14,
      tabSize: (config.tabSize as number) ?? 2,
      autosaveEnabled: (config.autosaveEnabled as boolean) ?? true,
      autosaveInterval: (config.autosaveInterval as number) ?? 2000,
    })),
  persistConfig: async () => {
    const state = get()
    await saveConfig({
      vaultPath: state.vaultPath,
      theme: state.theme,
      colorScheme: state.colorScheme,
      sidebarWidth: state.sidebarWidth,
      editorMode: state.editorMode,
      fontSize: state.fontSize,
      tabSize: state.tabSize,
      autosaveEnabled: state.autosaveEnabled,
      autosaveInterval: state.autosaveInterval,
    })
  },
}))
