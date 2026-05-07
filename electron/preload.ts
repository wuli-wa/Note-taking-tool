import { contextBridge, ipcRenderer } from 'electron'

try {
  contextBridge.exposeInMainWorld('electronAPI', {
    // Dialog
    openVault: () => ipcRenderer.invoke('dialog:openVault'),

    // File system
    readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
    readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    writeBinary: (filePath: string, buffer: ArrayBuffer) => ipcRenderer.invoke('fs:writeBinary', filePath, buffer),
    createFile: (dirPath: string, name: string) => ipcRenderer.invoke('fs:createFile', dirPath, name),
    createFolder: (dirPath: string, name: string) => ipcRenderer.invoke('fs:createFolder', dirPath, name),
    deleteItem: (itemPath: string) => ipcRenderer.invoke('fs:deleteItem', itemPath),
    renameItem: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:renameItem', oldPath, newPath),
    moveItem: (srcPath: string, destDir: string) => ipcRenderer.invoke('fs:moveItem', srcPath, destDir),
    getAssetDir: (vaultPath: string) => ipcRenderer.invoke('fs:getAssetDir', vaultPath),

    // Config
    loadConfig: () => ipcRenderer.invoke('config:load'),
    saveConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('config:save', config),

    // File watching
    startWatch: (vaultPath: string) => ipcRenderer.invoke('file:startWatch', vaultPath),
    stopWatch: () => ipcRenderer.invoke('file:stopWatch'),
    onFileChange: (callback: (data: any) => void) => {
      const listener = (_event: any, data: any) => callback(data)
      ipcRenderer.on('file:changed', listener)
      return () => ipcRenderer.removeListener('file:changed', listener)
    },

    // Window close protection
    onBeforeClose: (callback: () => void) => {
      ipcRenderer.on('app:beforeClose', () => callback())
      return () => { ipcRenderer.removeAllListeners('app:beforeClose') }
    },
    confirmClose: () => ipcRenderer.send('app:confirmClose'),
  })
  console.log('[Preload] electronAPI exposed successfully')
} catch (e) {
  console.error('[Preload] Failed to expose electronAPI:', e)
}
