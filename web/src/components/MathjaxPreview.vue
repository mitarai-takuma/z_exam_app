<template>
  <div ref="container"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{ content: string }>()
const container = ref<HTMLElement | null>(null)

onMounted(() => render())
watch(
  () => props.content,
  () => render(),
)

async function render() {
  if (!container.value) return
  const mj = await import('mathjax/es5/tex-mml-chtml.js')
  container.value.innerHTML = ''
  const div = document.createElement('div')
  div.textContent = props.content
  container.value.appendChild(div)
  // @ts-ignore
  ;(window as any).MathJax?.typesetPromise?.([container.value])
}
</script>
