import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null
let vaultWatchers: fs.FSWatcher[] = []
let forceClose = false
let saveTimer: ReturnType<typeof setTimeout> | null = null

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'mindcurrent-config.json')
}

function saveWindowState() {
  if (!mainWindow) return
  const bounds = mainWindow.getBounds()
  const configPath = getConfigPath()
  let config: Record<string, unknown> = {}
  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    }
  } catch { /* ignore */ }
  config.windowBounds = bounds
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  } catch { /* ignore */ }
}

function createWindow() {
  // Restore saved window bounds
  let savedBounds: { x?: number; y?: number; width?: number; height?: number } | null = null
  try {
    const configPath = getConfigPath()
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      if (config.windowBounds) savedBounds = config.windowBounds
    }
  } catch { /* ignore */ }

  mainWindow = new BrowserWindow({
    width: savedBounds?.width ?? 1400,
    height: savedBounds?.height ?? 900,
    x: savedBounds?.x,
    y: savedBounds?.y,
    minWidth: 900,
    minHeight: 600,
    title: 'MindCurrent',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Save window state on move/resize (debounced)
  mainWindow.on('resize', () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(saveWindowState, 500)
  })
  mainWindow.on('move', () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(saveWindowState, 500)
  })

  // Close protection
  mainWindow.on('close', (e) => {
    if (forceClose) return
    e.preventDefault()
    mainWindow?.webContents.send('app:beforeClose')
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('[Main] Loading dev URL:', process.env.VITE_DEV_SERVER_URL)
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    const loadPath = path.join(__dirname, '../dist/index.html')
    console.log('[Main] Loading file:', loadPath)
    mainWindow.loadFile(loadPath)
  }

  // Open DevTools in dev mode for debugging
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools()
  }

  Menu.setApplicationMenu(null)
}

function watchVault(vaultPath: string) {
  // Close existing watchers
  for (const w of vaultWatchers) {
    try { w.close() } catch { /* ignore */ }
  }
  vaultWatchers = []

  function watchRecursive(dir: string) {
    try {
      const w = fs.watch(dir, (_eventType, filename) => {
        if (filename && !filename.startsWith('.')) {
          mainWindow?.webContents.send('file:changed', {
            filename,
            directory: dir,
          })
        }
      })
      vaultWatchers.push(w)

      // Watch subdirectories
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const e of entries) {
          if (e.isDirectory() && !e.name.startsWith('.')) {
            watchRecursive(path.join(dir, e.name))
          }
        }
      } catch { /* ignore */ }
    } catch { /* ignore */ }
  }

  watchRecursive(vaultPath)
}

// ---- Vault / File operations ----

async function readDir(dirPath: string): Promise<{ name: string; path: string; isDir: boolean }[]> {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    return entries
      .filter(e => !e.name.startsWith('.mindcurrent') && !e.name.startsWith('.'))
      .map(e => ({
        name: e.name,
        path: path.join(dirPath, e.name),
        isDir: e.isDirectory(),
      }))
      .sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  } catch {
    return []
  }
}

function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

function writeFile(filePath: string, content: string): boolean {
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    return true
  } catch {
    return false
  }
}

function createFile(dirPath: string, name: string): string | null {
  try {
    const filePath = path.join(dirPath, `${name}.md`)
    const template = `---
title: "${name}"
created: ${new Date().toISOString()}
updated: ${new Date().toISOString()}
tags: []
---

# ${name}

`
    fs.writeFileSync(filePath, template, 'utf-8')
    return filePath
  } catch {
    return null
  }
}

function createFolder(dirPath: string, name: string): string | null {
  try {
    const folderPath = path.join(dirPath, name)
    fs.mkdirSync(folderPath, { recursive: true })
    return folderPath
  } catch {
    return null
  }
}

function deleteItem(itemPath: string): boolean {
  try {
    fs.rmSync(itemPath, { recursive: true })
    return true
  } catch {
    return false
  }
}

function renameItem(oldPath: string, newPath: string): boolean {
  try {
    fs.renameSync(oldPath, newPath)
    return true
  } catch {
    return false
  }
}

function moveItem(srcPath: string, destDir: string): boolean {
  try {
    const name = path.basename(srcPath)
    const destPath = path.join(destDir, name)
    if (fs.existsSync(destPath)) return false
    fs.renameSync(srcPath, destPath)
    return true
  } catch {
    return false
  }
}

// ---- IPC Handlers ----

ipcMain.handle('dialog:openVault', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择笔记库文件夹',
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('fs:readDir', async (_e, dirPath: string) => {
  return readDir(dirPath)
})

ipcMain.handle('fs:readFile', async (_e, filePath: string) => {
  return readFile(filePath)
})

ipcMain.handle('fs:writeFile', async (_e, filePath: string, content: string) => {
  return writeFile(filePath, content)
})

ipcMain.handle('fs:createFile', async (_e, dirPath: string, name: string) => {
  return createFile(dirPath, name)
})

ipcMain.handle('fs:createFolder', async (_e, dirPath: string, name: string) => {
  return createFolder(dirPath, name)
})

ipcMain.handle('fs:deleteItem', async (_e, itemPath: string) => {
  return deleteItem(itemPath)
})

ipcMain.handle('fs:renameItem', async (_e, oldPath: string, newPath: string) => {
  return renameItem(oldPath, newPath)
})

ipcMain.handle('fs:moveItem', async (_e, srcPath: string, destDir: string) => {
  return moveItem(srcPath, destDir)
})

ipcMain.handle('fs:getAssetDir', async (_e, vaultPath: string) => {
  const assetDir = path.join(vaultPath, 'assets')
  if (!fs.existsSync(assetDir)) {
    fs.mkdirSync(assetDir, { recursive: true })
  }
  return assetDir
})

ipcMain.handle('fs:writeBinary', async (_e, filePath: string, buffer: ArrayBuffer) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(buffer))
    return true
  } catch {
    return false
  }
})

ipcMain.handle('config:load', async () => {
  try {
    const configPath = getConfigPath()
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8')
      return JSON.parse(raw)
    }
  } catch { /* ignore */ }
  return {}
})

ipcMain.handle('config:save', async (_e, config: Record<string, unknown>) => {
  try {
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf-8')
    return true
  } catch {
    return false
  }
})

// File watching
ipcMain.handle('file:startWatch', async (_e, vaultPath: string) => {
  watchVault(vaultPath)
  return true
})

ipcMain.handle('file:stopWatch', async () => {
  for (const w of vaultWatchers) {
    try { w.close() } catch { /* ignore */ }
  }
  vaultWatchers = []
  return true
})

// Close confirmation
ipcMain.on('app:confirmClose', () => {
  forceClose = true
  mainWindow?.close()
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
