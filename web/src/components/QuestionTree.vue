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
import { useRouter } from 'vue-router'
import type { Question } from '../types'

const props = defineProps<{ questions: Question[]; selectedId: number | null }>()
const emit = defineEmits<{ (e: 'select', id: number): void }>()

const treeData = computed(() => {
  // Group by round -> section and sort for stable display
  const grouped = new Map<number, Map<number, Question[]>>()
  for (const q of props.questions) {
    if (!grouped.has(q.round)) grouped.set(q.round, new Map())
    const sections = grouped.get(q.round)!
    if (!sections.has(q.section)) sections.set(q.section, [])
    sections.get(q.section)!.push(q)
  }

  const result = Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([round, secMap]) => ({
      key: `r-${round}`,
      // Round node shows its own level
      label: `回${round}`,
      children: Array.from(secMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([section, items]) => ({
          key: `r-${round}-s-${section}`,
          // Section node shows path up to section
          label: `回${round}/セクション${section}`,
          children: items
            .slice()
            .sort((a, b) => a.id - b.id)
            .map((q) => ({
              key: `q-${q.id}`,
              // Leaf shows full hierarchical path including ID
              label: `回${round}/セクション${section}/ID${q.id}`,
            })),
        })),
    }))
  return result
})

const currentKey = computed(() => (props.selectedId != null ? `q-${props.selectedId}` : undefined))

const router = useRouter()

// When a round (回) node is expanded, expand all its child section nodes
function onNodeExpand(data: any, node: any) {
  const key: string = String(data?.key ?? '')
  if (/^r-\d+$/.test(key) && Array.isArray(node?.childNodes)) {
    node.childNodes.forEach((child: any) => {
  if (typeof child?.expand === 'function') child.expand()
      else if (child) child.expanded = true
    })
  }
}

function onNode(node: any) {
  // 問題ノード（leaf）選択時のみ
  const m = String(node.key).match(/^q-(\d+)$/)
  if (m) {
    // 問題IDから該当データを取得
    const id = Number(m[1])
    const q = props.questions.find(q => q.id === id)
    if (q) {
      // URLを /回/セクション/ID 形式でpush
      router.push({ path: `/${q.round}/${q.section}/${q.id}` })
    }
    emit('select', id)
  }
}
</script>
