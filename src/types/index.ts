export interface VaultEntry {
  name: string
  path: string
  isDir: boolean
}

export interface NoteFrontmatter {
  title?: string
  created?: string
  updated?: string
  tags?: string[]
  summary?: string
  aliases?: string[]
}

export interface NoteContent {
  frontmatter: NoteFrontmatter
  body: string
  raw: string
}

export type EditorMode = 'split' | 'edit' | 'preview'

export type Theme = 'light' | 'dark'

export type ColorScheme = 'default' | 'warm' | 'forest' | 'lavender' | 'ocean'

export interface SearchResult {
  filePath: string
  fileName: string
  matches: { line: number; text: string }[]
}

export interface AppSettings {
  vaultPath: string | null
  theme: Theme
  sidebarWidth: number
  editorMode: EditorMode
  fontSize: number
  tabSize: number
  autosaveEnabled: boolean
  autosaveInterval: number
  windowBounds: { x: number; y: number; width: number; height: number } | null
}

export interface AIConfig {
  provider: 'anthropic' | 'openai' | 'ollama'
  apiKey: string
  model: string
  summaryPrompt: string
  chatPrompt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: { filePath: string; title: string; snippet: string }[]
  timestamp: number
}
