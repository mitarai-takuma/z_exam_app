<template>
  <div ref="container" class="math-content"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import { ensureMathJax } from '../lib/mathjax'

const props = defineProps<{ content: string }>()
const container = ref<HTMLElement | null>(null)
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

onMounted(() => render())
watch(
  () => props.content,
  () => render(),
)

async function render() {
  if (!container.value) return
  // Convert Markdown to HTML first
  container.value.innerHTML = md.render(props.content || '')
  // Ensure MathJax is loaded and configured
  await ensureMathJax()
  // @ts-ignore
  window.MathJax?.typesetPromise?.([container.value])
}
</script>
