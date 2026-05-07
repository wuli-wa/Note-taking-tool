import { useState } from 'react'
import { X, Settings as SettingsIcon, Monitor, Moon, Sun, Type, Save, FolderOpen, FolderSync, Check } from 'lucide-react'
import { useStore } from '../store'
import { openVault } from '../lib/fileManager'
import type { ColorScheme } from '../types'

interface Props {
  open: boolean
  onClose: () => void
}

function ChangeVaultButton() {
  const setVaultPath = useStore((s) => s.setVaultPath)
  const [switching, setSwitching] = useState(false)

  const handleChange = async () => {
    setSwitching(true)
    try {
      const path = await openVault()
      if (path) setVaultPath(path)
    } finally {
      setSwitching(false)
    }
  }

  return (
    <button
      onClick={handleChange}
      disabled={switching}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-primary)] hover:bg-[var(--hover)] transition-colors disabled:opacity-50"
    >
      <FolderSync className="w-4 h-4" />
      {switching ? '正在选择...' : '更改笔记库'}
    </button>
  )
}

export default function Settings({ open, onClose }: Props) {
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const fontSize = useStore((s) => s.fontSize)
  const setFontSize = useStore((s) => s.setFontSize)
  const tabSize = useStore((s) => s.tabSize)
  const setTabSize = useStore((s) => s.setTabSize)
  const autosaveEnabled = useStore((s) => s.autosaveEnabled)
  const setAutosaveEnabled = useStore((s) => s.setAutosaveEnabled)
  const autosaveInterval = useStore((s) => s.autosaveInterval)
  const setAutosaveInterval = useStore((s) => s.setAutosaveInterval)
  const vaultPath = useStore((s) => s.vaultPath)
  const colorScheme = useStore((s) => s.colorScheme)
  const setColorScheme = useStore((s) => s.setColorScheme)

  const schemes: { id: ColorScheme; label: string; color: string }[] = [
    { id: 'default', label: '默认蓝', color: '#4c6ef5' },
    { id: 'warm', label: '暖琥珀', color: '#d4854e' },
    { id: 'forest', label: '青翠绿', color: '#5d8a5e' },
    { id: 'lavender', label: '薰衣紫', color: '#7c6eb0' },
    { id: 'ocean', label: '海洋青', color: '#4d8a8c' },
  ]

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed z-50 top-[10%] left-1/2 -translate-x-1/2 w-[460px] bg-[var(--editor-bg)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <SettingsIcon className="w-4 h-4 text-[var(--accent)]" />
            设置
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--hover)] text-[var(--text-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 max-h-[500px] overflow-y-auto">
          {/* Appearance */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
              <Monitor className="w-4 h-4 text-[var(--accent)]" />
              外观
            </h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--sidebar-bg)]">
              <div>
                <p className="text-sm text-[var(--text-primary)]">当前主题</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {theme === 'dark' ? '深色模式' : '浅色模式'}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-primary)] hover:bg-[var(--hover)] transition-colors"
              >
                {theme === 'dark' ? (
                  <><Sun className="w-4 h-4" /> 切换到浅色</>
                ) : (
                  <><Moon className="w-4 h-4" /> 切换到深色</>
                )}
              </button>
            </div>

            {/* Color scheme picker */}
            <div className="mt-3 p-3 rounded-lg bg-[var(--sidebar-bg)]">
              <p className="text-xs text-[var(--text-secondary)] mb-2">主题色彩</p>
              <div className="flex gap-2">
                {schemes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setColorScheme(s.id)}
                    className="flex flex-col items-center gap-1 flex-1"
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"
                      style={{
                        backgroundColor: s.color,
                        borderColor: colorScheme === s.id ? 'var(--text-primary)' : 'transparent',
                        boxShadow: colorScheme === s.id ? `0 0 0 2px ${s.color}40` : undefined,
                      }}
                    >
                      {colorScheme === s.id && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-[11px] ${colorScheme === s.id ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}`}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Editor */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
              <Type className="w-4 h-4 text-[var(--accent)]" />
              编辑器
            </h3>
            <div className="p-3 rounded-lg bg-[var(--sidebar-bg)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-primary)]">字体大小</span>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="text-sm bg-[var(--editor-bg)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)]"
                >
                  {[12, 13, 14, 15, 16, 18, 20].map((n) => (
                    <option key={n} value={n}>{n}px</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-primary)]">Tab 大小</span>
                <select
                  value={tabSize}
                  onChange={(e) => setTabSize(Number(e.target.value))}
                  className="text-sm bg-[var(--editor-bg)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)]"
                >
                  {[2, 4, 8].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Autosave */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
              <Save className="w-4 h-4 text-[var(--accent)]" />
              自动保存
            </h3>
            <div className="p-3 rounded-lg bg-[var(--sidebar-bg)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-primary)]">启用自动保存</span>
                <button
                  onClick={() => setAutosaveEnabled(!autosaveEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors ${
                    autosaveEnabled ? 'bg-[var(--accent)]' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      autosaveEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              {autosaveEnabled && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-primary)]">保存延迟</span>
                  <select
                    value={autosaveInterval}
                    onChange={(e) => setAutosaveInterval(Number(e.target.value))}
                    className="text-sm bg-[var(--editor-bg)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)]"
                  >
                    <option value={1000}>1 秒</option>
                    <option value={2000}>2 秒</option>
                    <option value={5000}>5 秒</option>
                    <option value={10000}>10 秒</option>
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Data */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
              <FolderOpen className="w-4 h-4 text-[var(--accent)]" />
              数据
            </h3>
            <div className="p-3 rounded-lg bg-[var(--sidebar-bg)] space-y-3">
              <div>
                <p className="text-xs text-[var(--text-secondary)]">笔记库路径</p>
                <p className="text-sm text-[var(--text-primary)] mt-1 break-all">{vaultPath || '未选择'}</p>
              </div>
              <ChangeVaultButton />
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
              关于
            </h3>
            <div className="p-3 rounded-lg bg-[var(--sidebar-bg)] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">版本</span>
                <span className="text-[var(--text-primary)]">0.1.0 MVP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">技术栈</span>
                <span className="text-[var(--text-primary)]">Electron + React</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)] text-center">
                MindCurrent - 基于本地 Markdown 文件的智能笔记应用
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
