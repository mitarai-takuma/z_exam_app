<template>
  <div ref="container" class="math-content"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import { ensureMathJax } from '../lib/mathjax'

const props = defineProps<{ content: string }>()
const container = ref<HTMLElement | null>(null)
const md = new MarkdownIt({
  html: false, // do not allow raw HTML for safety
  linkify: true,
  breaks: true,
})

onMounted(() => render())
watch(
  () => props.content,
  () => render(),
)

async function render() {
  if (!container.value) return
  // Convert Markdown to HTML first
  const html = md.render(props.content || '')
  container.value.innerHTML = html
  // Ensure MathJax is loaded and configured, then typeset
  await ensureMathJax()
  // @ts-ignore
  ;(window as any).MathJax?.typesetPromise?.([container.value])
}
</script>
