import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'
import { loadFile, loadEntries } from '../lib/fileManager'
import { parseMarkdown, fileNameToTitle } from '../lib/markdown'
import { Search, X, FileText, Folder } from 'lucide-react'
import type { SearchResult } from '../types'

export default function SearchPanel() {
  const showSearch = useStore((s) => s.showSearch)
  const setShowSearch = useStore((s) => s.setShowSearch)
  const vaultPath = useStore((s) => s.vaultPath)
  const openFile = useStore((s) => s.openFile)
  const searchQuery = useStore((s) => s.searchQuery)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const searchResults = useStore((s) => s.searchResults)
  const setSearchResults = useStore((s) => s.setSearchResults)

  const [localResults, setLocalResults] = useState<{ path: string; name: string; matches: string }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus on show
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [showSearch])

  // Search logic
  const doSearch = useCallback(
    async (query: string) => {
      if (!vaultPath || !query.trim()) {
        setLocalResults([])
        return
      }
      setSearchQuery(query)

      const allEntries = await loadAllFiles(vaultPath)
      const q = query.toLowerCase()
      const results: { path: string; name: string; matches: string }[] = []

      for (const entry of allEntries) {
        const raw = await loadFile(entry.path)
        if (!raw) continue

        const nameMatch = entry.name.toLowerCase().includes(q)
        const contentMatch = raw.toLowerCase().includes(q)

        if (nameMatch || contentMatch) {
          let matches = ''
          if (contentMatch) {
            const idx = raw.toLowerCase().indexOf(q)
            const start = Math.max(0, idx - 40)
            const end = Math.min(raw.length, idx + query.length + 40)
            matches = (start > 0 ? '...' : '') + raw.slice(start, end) + (end < raw.length ? '...' : '')
          }
          results.push({ path: entry.path, name: entry.name, matches })
        }
      }

      setLocalResults(results.slice(0, 20))
    },
    [vaultPath, setSearchQuery]
  )

  const handleOpen = async (filePath: string) => {
    const raw = await loadFile(filePath)
    if (raw) {
      const content = parseMarkdown(raw)
      openFile(filePath, content)
      setShowSearch(false)
    }
  }

  if (!showSearch) return null

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={() => setShowSearch(false)} />
      <div className="fixed z-40 top-[20%] left-1/2 -translate-x-1/2 w-[560px] max-h-[400px] bg-[var(--editor-bg)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); doSearch(e.target.value) }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowSearch(false)
              if (e.key === 'Enter' && localResults.length > 0) {
                handleOpen(localResults[0].path)
              }
            }}
            placeholder="搜索笔记（支持文件名和内容匹配）..."
            className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          <button
            onClick={() => setShowSearch(false)}
            className="p-0.5 rounded hover:bg-[var(--hover)] text-[var(--text-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto">
          {searchQuery && localResults.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              没有找到匹配的笔记
            </div>
          )}
          {localResults.map((r) => (
            <button
              key={r.path}
              onClick={() => handleOpen(r.path)}
              className="flex flex-col w-full px-4 py-2.5 hover:bg-[var(--hover)] border-b border-[var(--border)] last:border-b-0 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {fileNameToTitle(r.name)}
                </span>
              </div>
              {r.matches && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 ml-5.5 line-clamp-2">
                  {r.matches}
                </p>
              )}
            </button>
          ))}
          {!searchQuery && (
            <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              输入关键词开始搜索
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.claude', '.vscode', 'dist', '.vite', 'assets', 'public', 'src', 'electron',
])

async function loadAllFiles(dirPath: string): Promise<{ path: string; name: string }[]> {
  const result: { path: string; name: string }[] = []
  const entries = await loadEntries(dirPath)
  for (const entry of entries) {
    if (entry.isDir) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue
      const children = await loadAllFiles(entry.path)
      result.push(...children)
    } else if (entry.name.endsWith('.md')) {
      result.push(entry)
    }
  }
  return result
}
