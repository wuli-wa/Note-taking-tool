import { useEffect, useState, useRef, useCallback } from 'react'
import { useStore } from './store'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import Welcome from './components/Welcome'
import SearchPanel from './components/Search'
import AIPanel from './components/AIPanel'
import Settings from './components/Settings'
import StatusBar from './components/StatusBar'
import Toolbar from './components/Toolbar'
import { loadConfig } from './lib/fileManager'

export default function App() {
  const [showSettings, setShowSettings] = useState(false)
  const vaultPath = useStore((s) => s.vaultPath)
  const theme = useStore((s) => s.theme)
  const colorScheme = useStore((s) => s.colorScheme)
  const showSearch = useStore((s) => s.showSearch)
  const showAIPanel = useStore((s) => s.showAIPanel)
  const editorMode = useStore((s) => s.editorMode)
  const hydrateFromConfig = useStore((s) => s.hydrateFromConfig)
  const persistConfig = useStore((s) => s.persistConfig)
  const sidebarWidth = useStore((s) => s.sidebarWidth)
  const previewWidth = useStore((s) => s.previewWidth)
  const setPreviewWidth = useStore((s) => s.setPreviewWidth)
  const fontSize = useStore((s) => s.fontSize)
  const tabSize = useStore((s) => s.tabSize)
  const openTabs = useStore((s) => s.openTabs)
  const hasDirtyTabs = openTabs.some((t) => t.isDirty)
  const hydrated = useRef(false)

  // Load config on mount
  useEffect(() => {
    loadConfig().then((config) => {
      hydrateFromConfig(config)
      if (config.theme) {
        document.documentElement.classList.toggle('dark', config.theme === 'dark')
      }
      hydrated.current = true
    })
  }, [])

  // Persist config on relevant changes (debounced)
  useEffect(() => {
    if (!hydrated.current) return
    const timer = setTimeout(() => persistConfig(), 500)
    return () => clearTimeout(timer)
  }, [vaultPath, theme, colorScheme, sidebarWidth, previewWidth, editorMode, fontSize, tabSize])

  // Preview resize handle
  const handlePreviewResize = useCallback(() => {
    const handleMove = (e: MouseEvent) => {
      const totalWidth = window.innerWidth - sidebarWidth
      const previewW = totalWidth - e.clientX + sidebarWidth
      setPreviewWidth(Math.max(200, Math.min(totalWidth - 200, previewW)))
    }
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }, [sidebarWidth, setPreviewWidth])

  // Apply color scheme data attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', colorScheme)
  }, [colorScheme])

  // Window close protection
  useEffect(() => {
    if (!window.electronAPI) {
      console.warn('[MindCurrent] electronAPI not available for close protection')
      return
    }
    const unsubscribe = window.electronAPI.onBeforeClose(() => {
      if (hasDirtyTabs) {
        const confirmed = window.confirm('你有未保存的更改。确定退出吗？')
        if (confirmed) {
          window.electronAPI.confirmClose()
        }
      } else {
        window.electronAPI.confirmClose()
      }
    })
    return () => { try { unsubscribe() } catch { /* */ } }
  }, [hasDirtyTabs])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  if (!vaultPath) {
    return <Welcome />
  }

  return (
    <div className="flex flex-col h-full bg-[var(--editor-bg)]">
      {/* Toolbar */}
      <Toolbar onOpenSettings={() => setShowSettings(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Editor */}
        <div className={`flex-1 ${editorMode === 'preview' ? 'hidden' : ''}`}>
          <Editor />
        </div>

        {/* Resize handle (split mode only) */}
        {editorMode === 'split' && (
          <div
            onMouseDown={handlePreviewResize}
            className="w-1.5 cursor-col-resize hover:bg-[var(--accent)] active:bg-[var(--accent)] transition-colors shrink-0 group relative"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        )}

        {/* Preview */}
        <div
          className={
            editorMode === 'split'
              ? ''
              : editorMode === 'preview'
                ? 'flex-1'
                : editorMode === 'edit'
                  ? 'hidden'
                  : 'hidden'
          }
        >
          <Preview />
        </div>

        {/* Panels */}
        {showSearch && <SearchPanel />}
        {showAIPanel && <AIPanel />}
      </div>

      {/* Settings modal */}
      <Settings open={showSettings} onClose={() => setShowSettings(false)} />

      {/* Status bar */}
      <StatusBar />
    </div>
  )
}
