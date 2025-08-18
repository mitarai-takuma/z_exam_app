<template>
  <div>
    <el-tree
      :data="treeData"
      node-key="key"
      :props="{ label: 'label', children: 'children' }"
      @node-click="onNode"
      highlight-current
      :default-expand-all="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Question } from '../types'

const props = defineProps<{ questions: Question[]; selectedId: number | null }>()
const emit = defineEmits<{ (e: 'select', id: number): void }>()

const treeData = computed(() => {
  const grouped = new Map<number, Map<number, Question[]>>()
  for (const q of props.questions) {
    if (!grouped.has(q.round)) grouped.set(q.round, new Map())
    const sections = grouped.get(q.round)!
    if (!sections.has(q.section)) sections.set(q.section, [])
    sections.get(q.section)!.push(q)
  }
  const result = Array.from(grouped.entries()).map(([round, secMap]) => ({
    key: `r-${round}`,
    label: `回 ${round}`,
    children: Array.from(secMap.entries()).map(([section, items]) => ({
      key: `r-${round}-s-${section}`,
      label: `セクション ${section}`,
      children: items.map((q) => ({ key: `q-${q.id}`, label: `#${q.id} ${q.text.slice(0, 12)}` })),
    })),
  }))
  return result
})

function onNode(node: any) {
  const m = String(node.key).match(/^q-(\d+)$/)
  if (m) emit('select', Number(m[1]))
}
</script>
