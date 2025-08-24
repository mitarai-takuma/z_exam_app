<template>
  <!-- Markdown + KaTeX プレビュー表示コンテナ -->
  <div class="math-content" v-html="rendered"></div>
  
</template>
<script setup lang="ts">
import { computed } from 'vue'
import md from '../plugins/markdown-it'

// propsの型定義と受け取り（省略形を明示的に記述）
const props = defineProps({
  content: {
    type: String,
    required: true,
  },
})

// KaTeX付きMarkdownパース結果
const rendered = computed(() => {
  const input = props.content || ''
  return md.render(input)
})
</script>

<style scoped>
.math-content {
  /* Markdownの改行・空白を視覚的に維持 */
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>

/*
  このコンポーネントは、LaTeX数式やMarkdownを含むテキストを受け取り、
  Markdown→HTML変換（KaTeXで数式レンダリング）を行い表示します。
  - props.content: プレビュー対象のテキスト
  - md: MarkdownItインスタンス（KaTeXプラグイン適用済み）
*/
