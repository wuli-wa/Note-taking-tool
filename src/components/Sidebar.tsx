import { useEffect, useState, useCallback, useRef } from 'react'
import { useStore } from '../store'
import { loadEntries, loadFile, newNote, newFolder, deleteEntry, renameEntry, moveEntry, onFileChange, startWatch, stopWatch, saveFile } from '../lib/fileManager'
import { parseMarkdown, getTitle, serializeMarkdown } from '../lib/markdown'
import {
  Folder,
  FileText,
  Plus,
  FolderPlus,
  MoreVertical,
  Trash2,
  Pencil,
  ChevronRight,
  ChevronDown,
  Tag,
  Star,
  X,
} from 'lucide-react'
import type { VaultEntry } from '../types'

export default function Sidebar() {
  const vaultPath = useStore((s) => s.vaultPath)
  const entries = useStore((s) => s.entries)
  const setEntries = useStore((s) => s.setEntries)
  const sidebarWidth = useStore((s) => s.sidebarWidth)
  const setSidebarWidth = useStore((s) => s.setSidebarWidth)
  const selectedTag = useStore((s) => s.selectedTag)
  const setSelectedTag = useStore((s) => s.setSelectedTag)
  const allTags = useStore((s) => s.allTags)
  const setAllTags = useStore((s) => s.setAllTags)
  const openTabs = useStore((s) => s.openTabs)
  const activeTabIndex = useStore((s) => s.activeTabIndex)
  const openFile = useStore((s) => s.openFile)
  const closeTab = useStore((s) => s.closeTab)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const markTabDirty = useStore((s) => s.markTabDirty)

  const activeFile = activeTabIndex >= 0 ? openTabs[activeTabIndex] : null
  const activeFilePath = activeFile?.filePath ?? null

  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: VaultEntry } | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [creating, setCreating] = useState<{ dir: string; type: 'file' | 'folder' } | null>(null)
  const [createName, setCreateName] = useState('')
  const [draggedItem, setDraggedItem] = useState<VaultEntry | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // Load entries
  const refresh = useCallback(async () => {
    if (!vaultPath) return
    const result = await loadEntries(vaultPath)
    setEntries(result)
    // Don't reset expandedDirs here, preserve user's tree state
  }, [vaultPath, setEntries])

  useEffect(() => {
    refresh()
    if (!vaultPath) return
    startWatch(vaultPath)
    const unsubscribe = onFileChange(() => refresh())
    return () => {
      unsubscribe()
      stopWatch()
    }
  }, [vaultPath, refresh])

  // Load file on click
  const handleOpenFile = async (filePath: string) => {
    const raw = await loadFile(filePath)
    if (raw !== null) {
      const content = parseMarkdown(raw)
      openFile(filePath, content)
    }
  }

  // Toggle dir expand
  const toggleDir = (dirPath: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(dirPath)) next.delete(dirPath)
      else next.add(dirPath)
      return next
    })
  }

  // Create operations
  const handleCreateFile = (dir: string) => {
    setCreating({ dir, type: 'file' })
    setCreateName('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleCreateFolder = (dir: string) => {
    setCreating({ dir, type: 'folder' })
    setCreateName('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleCreateSubmit = async () => {
    if (!createName.trim() || !creating) return
    if (creating.type === 'file') {
      const filePath = await newNote(creating.dir, createName.trim())
      if (filePath) {
        await refresh()
        handleOpenFile(filePath)
      }
    } else {
      await newFolder(creating.dir, createName.trim())
      await refresh()
    }
    setCreating(null)
    setCreateName('')
  }

  // Rename operations
  const handleRenameStart = (item: VaultEntry) => {
    setRenaming(item.path)
    setRenameValue(item.name.replace(/\.md$/, ''))
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleRenameSubmit = async (oldPath: string) => {
    if (!renameValue.trim() || !vaultPath) return
    const dir = oldPath.replace(/\\/g, '/').split('/').slice(0, -1).join('/')
    const ext = oldPath.endsWith('.md') ? '.md' : ''
    const newPath = dir + '/' + renameValue.trim() + ext
    const ok = await renameEntry(oldPath, newPath)
    if (ok) {
      await refresh()
      // Update tab title if renamed file is open
      const tabIdx = openTabs.findIndex((t) => t.filePath === oldPath)
      if (tabIdx >= 0) {
        const title = newPath.replace(/\\/g, '/').split('/').pop()?.replace(/\.md$/, '') || ''
        useStore.setState((s) => {
          const tabs = [...s.openTabs]
          tabs[tabIdx] = { ...tabs[tabIdx], filePath: newPath, title }
          return { openTabs: tabs }
        })
      }
    }
    setRenaming(null)
  }

  // Delete
  const handleDelete = async (item: VaultEntry) => {
    const ok = await deleteEntry(item.path)
    if (ok) {
      await refresh()
      // Close tab if deleted file is open
      const tabIdx = openTabs.findIndex((t) => t.filePath === item.path)
      if (tabIdx >= 0) {
        closeTab(tabIdx)
      }
    }
  }

  // Drag & drop
  const handleDragStart = (item: VaultEntry) => {
    setDraggedItem(item)
  }

  const handleDragOver = (e: React.DragEvent, dirPath: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, destDir: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.isDir) return
    const ok = await moveEntry(draggedItem.path, destDir)
    if (ok) await refresh()
    setDraggedItem(null)
  }

  // Collect tags from all notes
  useEffect(() => {
    const loadTags = async () => {
      const tags = new Set<string>()
      for (const entry of entries) {
        if (!entry.isDir) {
          const raw = await loadFile(entry.path)
          if (raw) {
            const content = parseMarkdown(raw)
            for (const tag of content.frontmatter.tags || []) {
              tags.add(tag)
            }
          }
        }
      }
      setAllTags(Array.from(tags).sort())
    }
    loadTags()
  }, [entries, setAllTags])

  // Resize sidebar
  const resizeRef = useRef<HTMLDivElement>(null)
  const handleResizeStart = useCallback(() => {
    const handleMove = (e: MouseEvent) => {
      setSidebarWidth(Math.max(180, Math.min(500, e.clientX)))
    }
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }, [setSidebarWidth])

  // Render entries recursively
  const renderEntries = (dirPath: string, depth: number = 0) => {
    const dirEntries = entries.filter((e) => {
      const parentDir = e.path.replace(/\\/g, '/').split('/').slice(0, -1).join('/')
      return parentDir === dirPath
    })

    return dirEntries.map((entry) => (
      <div key={entry.path}>
        <div
          className={`flex items-center gap-1 py-0.5 pr-1 cursor-pointer hover:bg-[var(--hover)] rounded-r-md transition-colors group ${
            activeFilePath === entry.path
              ? 'bg-[var(--accent-light)] dark:bg-[var(--accent-soft)] text-[var(--accent)]'
              : 'text-[var(--text-secondary)]'
          }`}
          style={{ paddingLeft: 12 + depth * 14 }}
          onClick={() => entry.isDir ? toggleDir(entry.path) : handleOpenFile(entry.path)}
          onContextMenu={(e) => {
            e.preventDefault()
            setContextMenu({ x: e.clientX, y: e.clientY, item: entry })
          }}
          draggable={!entry.isDir}
          onDragStart={() => handleDragStart(entry)}
          onDragOver={(e) => entry.isDir && handleDragOver(e, entry.path)}
          onDrop={(e) => entry.isDir && handleDrop(e, entry.path)}
        >
          {/* Expand icon for dirs */}
          {entry.isDir ? (
            expandedDirs.has(entry.path) ? (
              <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
            )
          ) : (
            <div className="w-3.5" />
          )}

          {/* Icon */}
          {entry.isDir ? (
            <Folder className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
          ) : (
            <FileText className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
          )}

          {/* Name / Rename input */}
          {renaming === entry.path ? (
            <input
              ref={inputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit(entry.path)
                if (e.key === 'Escape') setRenaming(null)
              }}
              onBlur={() => setRenaming(null)}
              className="flex-1 text-sm bg-[var(--editor-bg)] border border-[var(--accent)] rounded px-1 py-0 outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm truncate flex-1">{entry.name}</span>
          )}

          {/* Actions */}
          <div className="hidden group-hover:flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); handleRenameStart(entry) }}
              className="p-0.5 rounded hover:bg-[var(--border)] text-[var(--text-muted)]"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(entry) }}
              className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-[var(--text-muted)] hover:text-red-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Recursive children */}
        {entry.isDir && expandedDirs.has(entry.path) && renderEntries(entry.path, depth + 1)}

        {/* Create input */}
        {creating && creating.dir === entry.path && entry.isDir && (
          <div
            className="flex items-center gap-1 py-0.5 pr-1"
            style={{ paddingLeft: 12 + (depth + 1) * 14 }}
          >
            {creating.type === 'file' ? (
              <FileText className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
            ) : (
              <Folder className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
            )}
            <input
              ref={inputRef}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSubmit()
                if (e.key === 'Escape') { setCreating(null); setCreateName('') }
              }}
              onBlur={() => { setCreating(null); setCreateName('') }}
              placeholder={creating.type === 'file' ? '笔记名称...' : '文件夹名...'}
              className="flex-1 text-sm bg-[var(--editor-bg)] border border-[var(--accent)] rounded px-1 py-0 outline-none"
            />
          </div>
        )}
      </div>
    ))
  }

  return (
    <>
      {/* Sidebar */}
      <div
        className="flex flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] shrink-0 overflow-hidden"
        style={{ width: sidebarWidth }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] shrink-0">
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            文件浏览器
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => vaultPath && handleCreateFile(vaultPath)}
              className="p-1 rounded hover:bg-[var(--hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="新建笔记"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => vaultPath && handleCreateFolder(vaultPath)}
              className="p-1 rounded hover:bg-[var(--hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="新建文件夹"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Create at root */}
        {creating && creating.dir === vaultPath && (
          <div className="flex items-center gap-1 py-1 px-3 border-b border-[var(--border)]">
            {creating.type === 'file' ? (
              <FileText className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
            ) : (
              <Folder className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
            )}
            <input
              ref={inputRef}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSubmit()
                if (e.key === 'Escape') { setCreating(null); setCreateName('') }
              }}
              onBlur={() => { setCreating(null); setCreateName('') }}
              placeholder={creating.type === 'file' ? '笔记名称...' : '文件夹名...'}
              className="flex-1 text-sm bg-[var(--editor-bg)] border border-[var(--accent)] rounded px-1.5 py-0.5 outline-none"
              autoFocus
            />
          </div>
        )}

        {/* File tree */}
        <div className="flex-1 overflow-y-auto py-1">
          {vaultPath && renderEntries(vaultPath)}

          {entries.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">此文件夹为空</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">点击 + 创建第一篇笔记</p>
            </div>
          )}
        </div>

        {/* Tags section */}
        {allTags.length > 0 && (
          <div className="border-t border-[var(--border)] shrink-0">
            <div className="px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              标签
            </div>
            <div className="px-2 pb-2 flex flex-wrap gap-1 max-h-[120px] overflow-y-auto">
              <button
                onClick={() => setSelectedTag(null)}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  selectedTag === null
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                全部
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                    selectedTag === tag
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Tag className="w-3 h-3 inline mr-0.5" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Open tabs */}
        {openTabs.length > 0 && (
          <div className="border-t border-[var(--border)] shrink-0">
            <div className="px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              打开的笔记
            </div>
            <div className="max-h-[180px] overflow-y-auto">
              {openTabs.map((tab, idx) => (
                <div
                  key={tab.filePath}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1 cursor-pointer text-sm group transition-colors ${
                    idx === activeTabIndex
                      ? 'bg-[var(--accent-light)] dark:bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--hover)]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate flex-1">{tab.title}</span>
                  {tab.isDirty && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" title="未保存" />
                  )}
                  {idx === activeTabIndex && (
                    <span className="w-1 h-4 rounded-full bg-[var(--accent)] shrink-0" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (tab.isDirty) {
                        if (!window.confirm('该笔记有未保存的更改，确定关闭吗？')) return
                      }
                      closeTab(idx)
                    }}
                    className="p-0.5 rounded hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleResizeStart}
        className="w-1 cursor-col-resize hover:bg-[var(--accent)] transition-colors shrink-0"
      />

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-[var(--editor-bg)] border border-[var(--border)] rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-[var(--hover)] text-[var(--text-primary)]"
              onClick={() => {
                handleRenameStart(contextMenu.item)
                setContextMenu(null)
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
              重命名
            </button>
            {contextMenu.item.isDir && (
              <>
                <button
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-[var(--hover)] text-[var(--text-primary)]"
                  onClick={() => {
                    handleCreateFile(contextMenu.item.path)
                    setContextMenu(null)
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  新建笔记
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-[var(--hover)] text-[var(--text-primary)]"
                  onClick={() => {
                    handleCreateFolder(contextMenu.item.path)
                    setContextMenu(null)
                  }}
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  新建文件夹
                </button>
              </>
            )}
            <div className="border-t border-[var(--border)] my-1" />
            <button
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
              onClick={() => {
                handleDelete(contextMenu.item)
                setContextMenu(null)
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除
            </button>
          </div>
        </>
      )}
    </>
  )
}
