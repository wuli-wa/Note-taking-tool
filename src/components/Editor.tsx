import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { saveFile, getAssetDir, saveBinary } from '../lib/fileManager'
import { parseMarkdown, serializeMarkdown } from '../lib/markdown'
import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorView, keymap } from '@codemirror/view'
import { githubDark, githubLight } from '@uiw/codemirror-theme-github'
import { defaultKeymap } from '@codemirror/commands'
import { searchKeymap, openSearchPanel } from '@codemirror/search'

export default function Editor() {
  const openTabs = useStore((s) => s.openTabs)
  const activeTabIndex = useStore((s) => s.activeTabIndex)
  const updateTabContent = useStore((s) => s.updateTabContent)
  const markTabDirty = useStore((s) => s.markTabDirty)
  const theme = useStore((s) => s.theme)
  const editorMode = useStore((s) => s.editorMode)
  const vaultPath = useStore((s) => s.vaultPath)
  const autosaveEnabled = useStore((s) => s.autosaveEnabled)
  const autosaveInterval = useStore((s) => s.autosaveInterval)
  const fontSize = useStore((s) => s.fontSize)
  const tabSize = useStore((s) => s.tabSize)

  const activeFile = activeTabIndex >= 0 ? openTabs[activeTabIndex] : null
  const activeFilePath = activeFile?.filePath ?? null
  const activeFileContent = activeFile?.content ?? null
  const isDirty = activeFile?.isDirty ?? false
  const findInNoteTrigger = useStore((s) => s.findInNoteTrigger)

  const [value, setValue] = useState('')
  const isInternalChange = useRef(false)
  const prevFilePath = useRef<string | null>(null)
  const editorViewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (activeFilePath !== prevFilePath.current) {
      prevFilePath.current = activeFilePath
      if (activeFileContent) {
        isInternalChange.current = true
        setValue(activeFileContent.raw)
      } else {
        setValue('')
      }
    }
  }, [activeFilePath, activeFileContent])

  const handleChange = useCallback(
    (val: string) => {
      if (isInternalChange.current) {
        isInternalChange.current = false
        return
      }
      setValue(val)
      const parsed = parseMarkdown(val)
      updateTabContent(parsed)
      markTabDirty(true)
    },
    [updateTabContent, markTabDirty]
  )

  // Save on Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (activeFilePath && activeFileContent) {
          const serialized = serializeMarkdown(activeFileContent)
          saveFile(activeFilePath, serialized)
          markTabDirty(false)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeFilePath, activeFileContent, markTabDirty])

  // Autosave
  useEffect(() => {
    if (!autosaveEnabled || !isDirty || !activeFilePath || !activeFileContent) return

    const timer = setTimeout(() => {
      const serialized = serializeMarkdown(activeFileContent)
      saveFile(activeFilePath, serialized)
      markTabDirty(false)
    }, autosaveInterval)

    return () => clearTimeout(timer)
  }, [value, autosaveEnabled, autosaveInterval])

  // Open find panel on toolbar trigger
  useEffect(() => {
    if (findInNoteTrigger > 0 && editorViewRef.current) {
      openSearchPanel(editorViewRef.current)
    }
  }, [findInNoteTrigger])

  // Paste image handler
  useEffect(() => {
    const handlePaste = async (e: Event) => {
      const ce = e as ClipboardEvent
      if (!vaultPath) return
      const items = ce.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const blob = item.getAsFile()
          if (!blob) continue

          const assetDir = await getAssetDir(vaultPath)
          const ext = blob.type.split('/')[1] || 'png'
          const name = `image_${Date.now()}.${ext}`
          const destPath = assetDir + '/' + name

          const arrayBuffer = await blob.arrayBuffer()
          const success = await saveBinary(destPath, arrayBuffer)
          if (success) {
            const mdImg = `![${name}](${destPath})`
            setValue((prev) => {
              const newVal = prev + '\n' + mdImg + '\n'
              const parsed = parseMarkdown(newVal)
              updateTabContent(parsed)
              markTabDirty(true)
              return newVal
            })
          }
        }
      }
    }

    const editorEl = document.querySelector('.cm-editor')
    if (editorEl) {
      editorEl.addEventListener('paste', handlePaste)
      return () => editorEl.removeEventListener('paste', handlePaste)
    }
  }, [vaultPath, activeFilePath, updateTabContent, markTabDirty])

  if (openTabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        <div className="text-center">
          <p className="text-sm">选择或创建一篇笔记开始编辑</p>
          <p className="text-xs mt-1 text-[var(--text-muted)]">Ctrl+P 快速搜索</p>
        </div>
      </div>
    )
  }

  const extensions = [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    keymap.of([...defaultKeymap, ...searchKeymap]),
    EditorView.theme({
      '&': { height: '100%' },
      '.cm-scroller': { overflow: 'auto' },
    }),
  ]

  return (
    <div className="h-full overflow-hidden" style={{ '--editor-font-size': `${fontSize}px` } as React.CSSProperties}>
      <CodeMirror
        height="100%"
        value={value}
        onChange={handleChange}
        extensions={extensions}
        theme={theme === 'dark' ? githubDark : githubLight}
        onCreateEditor={(view) => { editorViewRef.current = view }}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          foldGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: true,
          tabSize,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
        }}
      />
    </div>
  )
}
