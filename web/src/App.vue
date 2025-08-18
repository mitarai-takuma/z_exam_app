<template>
  <el-container style="height: 100vh">
    <el-header height="56px">
      <el-row justify="space-between" align="middle">
        <el-col :span="12">
          <strong>Z Exam App (Web)</strong>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <el-input ref="searchRef" v-model="keyword" placeholder="検索 (Ctrl+F)" style="max-width: 280px" size="small" />
          <input ref="fileInput" type="file" accept=".csv,text/csv" style="display:none" @change="onFileChange" />
          <el-button size="small" @click="triggerImport">インポート</el-button>
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
        <question-editor v-if="selected" :question="selected" @update="onUpdate" />
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
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  await store.load()
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})

const filtered = computed(() => store.filter(keyword.value))
const selected = computed(() => (selectedId.value ? store.getById(selectedId.value) : null))

function select(id: number) {
  selectedId.value = id
}

function onUpdate(payload: any) {
  if (selectedId.value) store.update(selectedId.value, payload)
}

function triggerImport() {
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const text = await file.text()
  await store.importCSV(text)
  input.value = ''
}

async function onExport() {
  const csv = await store.exportCSV()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'z_exam_questions.csv'
  a.click()
  URL.revokeObjectURL(url)
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
}
</script>

<style>
body, html { margin: 0; }
.empty { color: #999; padding: 24px; }
</style>
