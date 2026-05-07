import { useMemo } from 'react'
import { useStore } from '../store'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

export default function Preview() {
  const openTabs = useStore((s) => s.openTabs)
  const activeTabIndex = useStore((s) => s.activeTabIndex)
  const activeFileContent = activeTabIndex >= 0 ? openTabs[activeTabIndex]?.content : null
  const editorMode = useStore((s) => s.editorMode)
  const previewWidth = useStore((s) => s.previewWidth)

  const body = useMemo(() => {
    if (!activeFileContent) return ''
    return activeFileContent.body || ''
  }, [activeFileContent])

  // Process wiki links: [[note name]]
  const processedBody = useMemo(() => {
    return body.replace(/\[\[([^\]]+)\]\]/g, (_match, name) => {
      return `[${name}](mindcurrent://note/${encodeURIComponent(name)})`
    })
  }, [body])

  if (!activeFileContent) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        <div className="text-center">
          <p className="text-sm">预览区域</p>
          <p className="text-xs mt-1">打开一篇笔记即可预览</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-full overflow-y-auto bg-[var(--preview-bg)]"
      style={editorMode === 'split' ? { width: previewWidth } : undefined}
    >
      <div className="markdown-preview">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            a: ({ href, children, ...props }) => {
              if (href?.startsWith('mindcurrent://note/')) {
                return (
                  <span className="wiki-link" {...props}>
                    {children}
                  </span>
                )
              }
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                  {children}
                </a>
              )
            },
          }}
        >
          {processedBody}
        </ReactMarkdown>
      </div>
    </div>
  )
}
