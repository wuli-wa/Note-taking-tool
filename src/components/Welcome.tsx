import { useState } from 'react'
import { useStore } from '../store'
import { openVault } from '../lib/fileManager'
import { FolderOpen, Sparkles, Edit3, FileText } from 'lucide-react'

console.log('[MindCurrent] Welcome component loaded')

export default function Welcome() {
  const setVaultPath = useStore((s) => s.setVaultPath)
  const [loading, setLoading] = useState(false)

  console.log('[MindCurrent] Welcome rendering, store available:', !!setVaultPath)

  const handleOpenVault = async () => {
    console.log('[MindCurrent] handleOpenVault clicked')
    setLoading(true)
    try {
      const path = await openVault()
      console.log('[MindCurrent] openVault returned:', path)
      if (path) {
        setVaultPath(path)
      }
    } catch (e) {
      console.error('[MindCurrent] openVault error:', e)
    }
    setLoading(false)
  }

  return (
    <div style={{ border: '3px solid red' }} className="flex items-center justify-center h-full bg-gradient-to-br from-[var(--accent-light)] to-surface-100 dark:from-surface-900 dark:to-surface-800">
      <div className="text-center max-w-lg px-8 animate-fade-in">
        {/* Logo */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent)] shadow-lg">
            <Edit3 className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50 mb-3">
          MindCurrent
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mb-10 leading-relaxed">
          基于本地 Markdown 文件的智能笔记应用
          <br />
          数据完全由你掌控，AI 让知识管理更高效
        </p>

        {/* Open/Create vault */}
        <button
          onClick={handleOpenVault}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] hover:brightness-90 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-60"
        >
          <FolderOpen className="w-5 h-5" />
          {loading ? '正在打开...' : '打开笔记库文件夹'}
        </button>

        <p className="text-sm text-surface-400 mt-4">
          选择已有笔记文件夹，或新建一个空文件夹开始
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-6 mt-12">
          {[
            { icon: Edit3, title: 'Markdown 编辑', desc: '实时预览 / 分栏模式' },
            { icon: FileText, title: '本地文件', desc: '数据完全由你掌控' },
            { icon: Sparkles, title: 'AI 增强', desc: '智能摘要与问答' },
          ].map((f) => (
            <div key={f.title} className="text-center">
              <f.icon className="w-6 h-6 text-[var(--accent)] mx-auto mb-2" />
              <div className="text-sm font-medium text-surface-700 dark:text-surface-300">
                {f.title}
              </div>
              <div className="text-xs text-surface-400 mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
