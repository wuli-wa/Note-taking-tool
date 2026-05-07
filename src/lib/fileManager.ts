import type { VaultEntry, NoteFrontmatter } from '../types'

declare global {
  interface Window {
    electronAPI: {
      openVault: () => Promise<string | null>
      readDir: (dirPath: string) => Promise<VaultEntry[]>
      readFile: (filePath: string) => Promise<string | null>
      writeFile: (filePath: string, content: string) => Promise<boolean>
      writeBinary: (filePath: string, buffer: ArrayBuffer) => Promise<boolean>
      createFile: (dirPath: string, name: string) => Promise<string | null>
      createFolder: (dirPath: string, name: string) => Promise<string | null>
      deleteItem: (itemPath: string) => Promise<boolean>
      renameItem: (oldPath: string, newPath: string) => Promise<boolean>
      moveItem: (srcPath: string, destDir: string) => Promise<boolean>
      getAssetDir: (vaultPath: string) => Promise<string>
      loadConfig: () => Promise<Record<string, unknown>>
      saveConfig: (config: Record<string, unknown>) => Promise<boolean>
      startWatch: (vaultPath: string) => Promise<boolean>
      stopWatch: () => Promise<boolean>
      onFileChange: (callback: (data: { eventType: string; filePath: string }) => void) => () => void
      onBeforeClose: (callback: () => void) => () => void
      confirmClose: () => void
    }
  }
}

function getAPI() {
  if (!window.electronAPI) {
    console.error('[FileManager] window.electronAPI is not available. Is the preload script working?')
    throw new Error('electronAPI not available')
  }
  return window.electronAPI
}

const api = typeof window !== 'undefined' && window.electronAPI ? window.electronAPI : null
console.log('[FileManager] electronAPI available:', !!api)

function ensureAPI() {
  if (!api) throw new Error('electronAPI not available - preload script may have failed')
  return api
}

export async function openVault(): Promise<string | null> {
  return ensureAPI().openVault()
}

export async function loadEntries(dirPath: string): Promise<VaultEntry[]> {
  return ensureAPI().readDir(dirPath)
}

export async function loadFile(filePath: string): Promise<string | null> {
  return ensureAPI().readFile(filePath)
}

export async function saveFile(filePath: string, content: string): Promise<boolean> {
  return ensureAPI().writeFile(filePath, content)
}

export async function saveBinary(filePath: string, buffer: ArrayBuffer): Promise<boolean> {
  return ensureAPI().writeBinary(filePath, buffer)
}

export async function newNote(dirPath: string, name: string): Promise<string | null> {
  return ensureAPI().createFile(dirPath, name)
}

export async function newFolder(dirPath: string, name: string): Promise<string | null> {
  return ensureAPI().createFolder(dirPath, name)
}

export async function deleteEntry(itemPath: string): Promise<boolean> {
  return ensureAPI().deleteItem(itemPath)
}

export async function renameEntry(oldPath: string, newPath: string): Promise<boolean> {
  return ensureAPI().renameItem(oldPath, newPath)
}

export async function moveEntry(srcPath: string, destDir: string): Promise<boolean> {
  return ensureAPI().moveItem(srcPath, destDir)
}

export async function getAssetDir(vaultPath: string): Promise<string> {
  return ensureAPI().getAssetDir(vaultPath)
}

export async function loadConfig(): Promise<Record<string, unknown>> {
  if (!api) {
    console.warn('[FileManager] electronAPI not available, returning empty config')
    return {}
  }
  return api.loadConfig()
}

export async function saveConfig(config: Record<string, unknown>): Promise<boolean> {
  if (!api) return false
  return api.saveConfig(config)
}

export function onFileChange(callback: (data: { eventType: string; filePath: string }) => void): () => void {
  if (!api) {
    console.warn('[FileManager] electronAPI not available for file watching')
    return () => {}
  }
  return api.onFileChange(callback)
}

export function startWatch(vaultPath: string): Promise<boolean> {
  if (!api) return Promise.resolve(false)
  return api.startWatch(vaultPath)
}

export function stopWatch(): Promise<boolean> {
  if (!api) return Promise.resolve(false)
  return api.stopWatch()
}
