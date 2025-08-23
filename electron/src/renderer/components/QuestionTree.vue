<template>
  <div>
    <el-tree
      :data="treeData"
      node-key="key"
      :props="{ label: 'label', children: 'children' }"
  @node-click="onNode"
  @node-expand="onNodeExpand"
      highlight-current
  :current-node-key="currentKey"
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
  // group by round -> section
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

const currentKey = computed(() => (props.selectedId != null ? `q-${props.selectedId}` : undefined))

// When a round (回) node is expanded, expand all its child section nodes
function onNodeExpand(data: any, node: any) {
  const key: string = String(data?.key ?? '')
  if (/^r-\d+$/.test(key) && Array.isArray(node?.childNodes)) {
    node.childNodes.forEach((child: any) => {
      // child represents a section node; expand it so questions are visible
  if (typeof child?.expand === 'function') child.expand()
      else if (child) child.expanded = true
    })
  }
}

function onNode(node: any) {
  const m = String(node.key).match(/^q-(\d+)$/)
  if (m) emit('select', Number(m[1]))
}
</script>
