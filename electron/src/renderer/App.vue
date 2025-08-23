<template>
  <el-container style="height: 100vh">
    <el-header height="56px">
      <el-row justify="space-between" align="middle">
        <el-col :span="12">
          <strong>Z Exam App</strong>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <el-input ref="searchRef" v-model="keyword" placeholder="検索 (Ctrl+F)" style="max-width: 280px" size="small" />
          <el-button size="small" @click="onImport">インポート</el-button>
          <el-button size="small" @click="onExport">エクスポート</el-button>
          <el-button type="primary" size="small" @click="save">保存</el-button>
        </el-col>
      </el-row>
    </el-header>
    <el-container>
      <el-aside width="33%" style="border-right: 1px solid var(--el-border-color)">
        <question-tree :questions="filtered" :selected-id="selectedId" @select="select" />
      </el-aside>
      <el-main>
  <question-editor v-if="selected" :key="selectedKey" :question="selected" @update="onUpdate" />
        <div v-else class="empty">テスト問題がありません</div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useQuestionsStore } from './stores/questions'
import QuestionTree from './components/QuestionTree.vue'
import QuestionEditor from './components/QuestionEditor.vue'

const store = useQuestionsStore()
const keyword = ref('')
const selectedId = ref<number | null>(null)
const searchRef = ref()

onMounted(async () => {
  await store.load()
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})

const filtered = computed(() => store.filter(keyword.value))
const selected = computed(() => (selectedId.value != null ? store.getById(selectedId.value) : null))
const selectedKey = computed(() => (selectedId.value != null ? `q-${selectedId.value}` : undefined))

function select(id: number) {
  selectedId.value = id
}

function onUpdate(payload: any) {
  if (selectedId.value != null) store.update(selectedId.value, payload)
}

async function onImport() {
  await store.importCSV()
}
async function onExport() {
  await store.exportCSV()
}
async function save() {
  await store.save()
}

function onKey(e: KeyboardEvent) {
  if (e.ctrlKey && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    searchRef.value?.focus?.()
  }
  if (e.ctrlKey && e.key.toLowerCase() === 's') {
    e.preventDefault()
    save()
  }
  if (e.ctrlKey && e.key.toLowerCase() === 'i') {
    e.preventDefault()
    onImport()
  }
  if (e.ctrlKey && e.key.toLowerCase() === 'e') {
    e.preventDefault()
    onExport()
  }
}
</script>

<style>
body, html { margin: 0; }
.empty { color: #999; padding: 24px; }
/* Prevent LaTeX (MathJax) from being vertically clipped in tight line boxes */
mjx-container { overflow: visible !important; }
/* Slightly relax line-height for containers that include formulas */
.math-content, mjx-container * { line-height: 1.2; }
</style>
