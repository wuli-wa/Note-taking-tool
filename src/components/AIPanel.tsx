import { useStore } from '../store'
import { X, Sparkles, Bot, Construction } from 'lucide-react'

export default function AIPanel() {
  const showAIPanel = useStore((s) => s.showAIPanel)
  const setShowAIPanel = useStore((s) => s.setShowAIPanel)
  const openTabs = useStore((s) => s.openTabs)
  const activeTabIndex = useStore((s) => s.activeTabIndex)
  const activeFileContent = activeTabIndex >= 0 ? openTabs[activeTabIndex]?.content : null

  if (!showAIPanel) return null

  return (
    <div className="flex flex-col w-[360px] border-l border-[var(--border)] bg-[var(--editor-bg)] shrink-0 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          AI 助手
        </div>
        <button
          onClick={() => setShowAIPanel(false)}
          className="p-1 rounded hover:bg-[var(--hover)] text-[var(--text-muted)]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Placeholder */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--accent-light)] dark:bg-[var(--accent-soft)] mb-4">
            <Construction className="w-7 h-7 text-[var(--accent)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            AI 功能即将上线
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-[260px]">
            智能摘要与标签生成、基于笔记内容的对话问答等功能正在开发中，敬请期待。
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
            {['智能摘要', '自动标签', '笔记问答', '语义搜索'].map((f) => (
              <span
                key={f}
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--hover)] text-[var(--text-muted)]"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
