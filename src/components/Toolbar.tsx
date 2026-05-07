import { useStore } from '../store'
import {
  Columns,
  Eye,
  Edit3,
  Search,
  FileSearch,
  Sparkles,
  Sun,
  Moon,
  Settings,
} from 'lucide-react'
import type { EditorMode } from '../types'

interface Props {
  onOpenSettings: () => void
}

export default function Toolbar({ onOpenSettings }: Props) {
  const editorMode = useStore((s) => s.editorMode)
  const setEditorMode = useStore((s) => s.setEditorMode)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const setShowSearch = useStore((s) => s.setShowSearch)
  const triggerFindInNote = useStore((s) => s.triggerFindInNote)
  const setShowAIPanel = useStore((s) => s.setShowAIPanel)
  const openTabs = useStore((s) => s.openTabs)
  const activeTabIndex = useStore((s) => s.activeTabIndex)
  const activeFile = activeTabIndex >= 0 ? openTabs[activeTabIndex] : null
  const activeFilePath = activeFile?.filePath ?? null
  const isDirty = activeFile?.isDirty ?? false

  const modes: { mode: EditorMode; icon: typeof Columns; label: string }[] = [
    { mode: 'split', icon: Columns, label: '分栏模式' },
    { mode: 'edit', icon: Edit3, label: '纯编辑' },
    { mode: 'preview', icon: Eye, label: '纯预览' },
  ]

  return (
    <div className="flex items-center h-10 px-3 border-b border-[var(--border)] bg-[var(--editor-bg)] select-none shrink-0">
      {/* Title */}
      <div className="flex items-center gap-2 min-w-[200px] mr-4">
        <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
          {activeFilePath
            ? activeFilePath.replace(/\\/g, '/').split('/').pop()?.replace(/\.md$/, '')
            : 'MindCurrent'}
        </span>
        {isDirty && (
          <span className="w-2 h-2 rounded-full bg-[var(--accent)]" title="未保存" />
        )}
      </div>

      {/* View modes */}
      <div className="flex items-center gap-1 bg-[var(--hover)] rounded-lg p-0.5">
        {modes.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setEditorMode(mode)}
            className={`p-1.5 rounded-md transition-colors ${
              editorMode === mode
                ? 'bg-[var(--editor-bg)] shadow-sm text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowSearch(true)}
          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)] transition-colors"
          title="搜索笔记 (Ctrl+P)"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={triggerFindInNote}
          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)] transition-colors"
          title="查找笔记内字段 (Ctrl+F)"
        >
          <FileSearch className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowAIPanel(true)}
          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)] transition-colors"
          title="AI 面板"
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-[var(--border)] mx-1" />
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)] transition-colors"
          title="设置"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)] transition-colors"
          title="切换主题"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
