<template>
  <!-- 数式やMarkdownをプレビュー表示するコンテナ -->
  <div ref="container" class="math-content"></div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import { ensureMathJax } from '../lib/mathjax'

// propsの型定義と受け取り（省略形を明示的に記述）
const props = defineProps({
  content: {
    type: String,
    required: true,
  },
})

// プレビュー描画用のDOM参照
const container = ref<HTMLElement | null>(null)
const lastRendered = ref<string>('')

// Markdownパーサーのインスタンス生成
const md = new MarkdownIt({
  html: false, // セキュリティのためHTMLは無効
  linkify: true, // URLを自動リンク化
  breaks: true,  // 改行を<br>に変換
})

// 初回マウント時に描画
onMounted(() => {
  render()
})

// contentが変化したら再描画
watch(
  () => props.content,
  () => {
    render()
  },
)

// Markdown→HTML変換＋MathJax数式レンダリング
async function render() {
  if (!container.value) return
  if (props.content === lastRendered.value) return
  // 1) 数式領域をMarkdownの強調（_や*）から保護するため、一旦プレースホルダに置換
  const { masked, segments } = maskMathSegments(props.content || '')
  // 2) MarkdownをHTMLに変換
  const html = md.render(masked)
  // 3) 変換後のHTML内でプレースホルダを元の数式（$...$ / $$...$$）に復元
  const restoredHtml = restoreMathSegments(html, segments)
  container.value.innerHTML = restoredHtml
  // MathJaxのロードと数式レンダリング
  await ensureMathJax()
  // @ts-ignore: MathJax型定義の都合
  ;(window as any).MathJax?.typesetPromise?.([container.value])
  lastRendered.value = props.content || ''
}

// --- ヘルパ: 数式のマスキング＆復元 ---
// MarkdownIt は $...$ を特別扱いしないため、内部の '_' などが <em> 等に変換され数式が壊れる。
// これを避けるため、Markdown 変換前に $...$ / $$...$$ をプレースホルダに置換し、変換後に復元する。
const MATH_TOKEN_PREFIX = '@@MATHJAX_SEG_'

function maskMathSegments(src: string): { masked: string; segments: string[] } {
  const segments: string[] = []

  // 先にブロック数式 $$...$$ を保護
  let masked = src.replace(/\$\$([\s\S]+?)\$\$/g, (_m, inner: string) => {
    const original = `$$${inner}$$`
    const token = `${MATH_TOKEN_PREFIX}${segments.length}@@`
    segments.push(original)
    return token
  })

  // 次にインライン数式 $...$ を保護（$$ は既に除外済み）
  // 前置1文字を保持して置換（行頭対応のため）
  masked = masked.replace(/(^|[^$])\$(?!\$)([^\n$]+?)\$(?!\$)/g, (_m, prefix: string, inner: string) => {
    const original = `$${inner}$`
    const token = `${MATH_TOKEN_PREFIX}${segments.length}@@`
    segments.push(original)
    return `${prefix}${token}`
  })

  return { masked, segments }
}

function restoreMathSegments(html: string, segments: string[]): string {
  let out = html
  segments.forEach((seg, i) => {
    const token = `${MATH_TOKEN_PREFIX}${i}@@`
    out = out.split(token).join(seg)
  })
  return out
}
</script>

<style scoped>
.math-content {
  /* Markdownの改行・空白を視覚的に維持 */
  white-space: pre-wrap;
  line-height: 1.6;
}
/* MathJax v3 の描画を崩さないための基本スタイル */
.math-content mjx-container[display="true"] {
  display: block;
  margin: 8px 0;
}
.math-content mjx-container {
  /* MathJax の出力内部は通常の空白処理に戻す（pre-wrapの影響で改行が入るのを防ぐ） */
  white-space: normal;
  overflow: visible; /* ルートや分数のはみ出しを切らない */
}
</style>

/*
  このコンポーネントは、LaTeX数式やMarkdownを含むテキストを受け取り、
  Markdown→HTML変換後にMathJaxで数式をレンダリングして表示します。
  - props.content: プレビュー対象のテキスト
  - container: 描画先DOM
  - md: MarkdownItインスタンス
  - ensureMathJax: MathJaxのロード・初期化関数
*/
