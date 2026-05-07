import type { NoteContent, NoteFrontmatter } from '../types'

// Minimal YAML-like frontmatter parser - no fs dependency, works in browser
function parseFrontmatter(raw: string): { data: NoteFrontmatter; content: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
  if (!match) {
    return { data: {}, content: raw }
  }

  const data: NoteFrontmatter = {}
  const lines = match[1].split('\n')

  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const key = line.slice(0, colonIdx).trim()
    let value: string = line.slice(colonIdx + 1).trim()

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    // Parse arrays like [tag1, tag2]
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrVal = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
      ;(data as Record<string, unknown>)[key] = arrVal
    } else {
      ;(data as Record<string, unknown>)[key] = value
    }
  }

  return { data, content: match[2] }
}

function stringifyFrontmatter(data: NoteFrontmatter): string {
  const lines: string[] = []
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined || val === null) continue
    if (Array.isArray(val)) {
      lines.push(`${key}: [${val.map(v => `"${v}"`).join(', ')}]`)
    } else if (typeof val === 'string' && val.includes(':')) {
      lines.push(`${key}: "${val}"`)
    } else {
      lines.push(`${key}: ${val}`)
    }
  }
  return lines.join('\n')
}

export function parseMarkdown(raw: string): NoteContent {
  try {
    const { data, content } = parseFrontmatter(raw)
    return {
      frontmatter: data,
      body: content,
      raw,
    }
  } catch {
    return { frontmatter: {}, body: raw, raw }
  }
}

export function serializeMarkdown(content: NoteContent): string {
  const frontmatter = { ...content.frontmatter }
  frontmatter.updated = new Date().toISOString()
  const yaml = stringifyFrontmatter(frontmatter)
  return `---\n${yaml}\n---\n\n${content.body}`
}

export function extractTags(content: NoteContent): string[] {
  return content.frontmatter.tags || []
}

export function getTitle(filePath: string, content?: NoteContent): string {
  if (content?.frontmatter.title) return content.frontmatter.title
  const name = filePath.replace(/\\/g, '/').split('/').pop() || ''
  return name.replace(/\.md$/, '')
}

export function fileNameToTitle(fileName: string): string {
  return fileName.replace(/\.md$/, '')
}
