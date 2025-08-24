import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import markdownItKatex from '@vscode/markdown-it-katex'

// 許可するタグ（それ以外はサニタイズ）
const allowedTags = [
  'div',
  'span',
  'article',
  'section',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'strike',
  'del',
  'sup',
  'sub',
  'br',
  'code',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'a',
  'ul',
  'ol',
  'li',
  'p',
  'blockquote',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'img',
  'details',
  'summary',
  // KaTeX/MathML tags
  'math',
  'semantics',
  'mrow',
  'mi',
  'mo',
  'mn',
  'msup',
  'msub',
  'mfrac',
  'munder',
  'mover',
  'munderover',
  'msqrt',
  'mroot',
  'annotation',
]

const md = new MarkdownIt({
  breaks: true,
  html: true,
  linkify: true,
  highlight: (str: string, lang: string): string => {
    let result
    if (lang && hljs.getLanguage(lang)) {
      try {
        result = hljs.highlight(str, {
          language: lang,
          ignoreIllegals: true,
        })
      } catch (_e) {
        result = hljs.highlightAuto(str)
      }
    } else {
      result = hljs.highlightAuto(str)
    }
    return (
      '<pre class="relative p-0 flex flex-col my-2">' +
      '<div class="w-full text-gray-200 bg-gray-600 flex items-center justify-between px-4 py-2 text-xs">' +
      `<span>${lang || ''}</span>` +
      '</div>' +
      `<code class="hljs overflow-scroll">` +
      result.value +
      '</code></pre>'
    )
  },
})

// 外部リンクは新規タブで開く
md.renderer.rules.link_open = (tokens, idx, options, _, self) => {
  const token = tokens[idx]
  token.attrPush(['target', '_blank'])
  token.attrPush(['rel', 'noopener noreferrer'])
  return self.renderToken(tokens, idx, options)
}

// pタグ除去（先頭の一組のみ）
function removeFirstPTag(md: MarkdownIt): void {
  md.core.ruler.push('remove_first_p_tag', (state) => {
    const tokens = state.tokens
    const pTagStartIndex = tokens.findIndex((t) => t.type === 'paragraph_open')
    const pTagEndIndex = tokens.findIndex((t) => t.type === 'paragraph_close')
    if (pTagStartIndex !== -1 && pTagEndIndex !== -1) {
      tokens.splice(pTagEndIndex, 1)
      tokens.splice(pTagStartIndex, 1)
    }
  })
}

// 不許可タグをサニタイズ
function sanitizeContentPlugin(md: MarkdownIt): void {
  md.core.ruler.push('sanitize_content', (state) => {
    state.tokens.forEach((token) => {
      if (token.type === 'html_inline' || token.type === 'html_block') {
        const tagMatch = token.content.match(/<\/?([a-zA-Z0-9]+)/)
        if (tagMatch && !allowedTags.includes(tagMatch[1].toLowerCase())) {
          token.content = md.utils.escapeHtml(token.content)
        }
      } else if (token.type === 'inline' && token.children) {
        token.children.forEach((child) => {
          if (child.type === 'html_inline' || child.type === 'html_block') {
            const tagMatch = child.content.match(/<\/?([a-zA-Z0-9]+)/)
            if (tagMatch && !allowedTags.includes(tagMatch[1].toLowerCase())) {
              child.content = md.utils.escapeHtml(child.content)
            }
          }
        })
      }
    })
  })
}

// LLMがよく出力する \( ... \) と \[ ... \] も解釈できるように拡張
function inlineMathEscaped(state: any, silent: boolean): boolean {
  const start = state.pos
  const max = state.posMax
  if (start + 2 > max || state.src.slice(start, start + 2) !== '\\(') return false
  let pos = start + 2
  let found = false
  while (pos < max - 1) {
    if (state.src.slice(pos, pos + 2) === '\\)') {
      found = true
      break
    }
    pos++
  }
  if (!found) return false
  const content = state.src.slice(start + 2, pos)
  if (content.trim() === '') return false
  if (
    state.backticksScanned &&
    (state.backticks[start] || state.backticks[pos + 2])
  ) {
    return false
  }
  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.markup = '\\('
    token.content = content
  }
  state.pos = pos + 2
  return true
}

function blockMathEscaped(state: any, start: number, end: number, silent: boolean): boolean {
  const startPos = state.bMarks[start] + state.tShift[start]
  const startMax = state.eMarks[start]
  if (startPos + 2 > startMax || state.src.slice(startPos, startPos + 2) !== '\\[') return false
  let pos = startPos + 2
  let next = start
  let found = false
  let lastLine = ''
  for (; next < end; next++) {
    pos = state.bMarks[next] + state.tShift[next]
    const max = state.eMarks[next]
    if (pos < max && state.tShift[next] < state.blkIndent) break
    const line = state.src.slice(pos, max)
    const closingIndex = line.indexOf('\\]')
    if (closingIndex !== -1) {
      lastLine = line.slice(0, closingIndex)
      found = true
      break
    }
  }
  if (!found) return false
  if (silent) return true
  const content = state.src.slice(
    startPos + 2,
    state.bMarks[next] + state.tShift[next] + lastLine.length,
  )
  state.line = next + 1
  const token = state.push('math_block', 'math', 0)
  token.block = true
  token.content = content.trim()
  token.map = [start, state.line]
  token.markup = '\\['
  return true
}

md.use(removeFirstPTag)
md.use(sanitizeContentPlugin)
md.use(markdownItKatex, {
  throwOnError: false,
  errorColor: 'red',
  strict: false,
})

md.inline.ruler.after('text', 'math_inline_escaped', inlineMathEscaped)
md.block.ruler.after('blockquote', 'math_block_escaped', blockMathEscaped, {
  alt: ['paragraph', 'reference', 'blockquote', 'list'],
})

export default md
