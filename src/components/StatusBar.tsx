import { useStore } from '../store'

export default function StatusBar() {
  const openTabs = useStore((s) => s.openTabs)
  const activeTabIndex = useStore((s) => s.activeTabIndex)
  const editorMode = useStore((s) => s.editorMode)
  const theme = useStore((s) => s.theme)

  const activeFile = activeTabIndex >= 0 ? openTabs[activeTabIndex] : null
  const activeFilePath = activeFile?.filePath ?? null
  const activeFileContent = activeFile?.content ?? null

  const wordCount = activeFileContent?.raw?.length ?? 0
  const lineCount = activeFileContent?.raw?.split('\n').length ?? 0

  return (
    <div className="flex items-center h-6 px-3 border-t border-[var(--border)] bg-[var(--sidebar-bg)] text-xs text-[var(--text-muted)] select-none shrink-0">
      <span className="mr-4">
        {activeFilePath || '未打开文件'}
      </span>
      {activeFilePath && (
        <>
          <span className="mr-3">{lineCount} 行</span>
          <span className="mr-3">{wordCount} 字符</span>
          <span className="mr-3 capitalize">模式: {editorMode}</span>
        </>
      )}
      <div className="flex-1" />
      <span className="capitalize">{theme}</span>
    </div>
  )
}
