<template>
  <!-- メインレイアウトコンテナ（全画面） -->
  <el-container style="height: 100vh">
    <!-- ヘッダー部分 -->
    <el-header height="56px">
      <el-row justify="space-between" align="middle">
        <!-- 左側：タイトル表示 -->
        <el-col v-bind:span="12">
          <strong>Z Exam App (Web)</strong>
        </el-col>
        <!-- 右側：検索・インポート・エクスポート・保存ボタン群 -->
        <el-col v-bind:span="12" style="text-align: right">
          <!-- 検索ボックス（Ctrl+Fでフォーカス） -->
          <el-input ref="searchRef"
            v-bind:model-value="keyword"
            v-on:update:model-value="(val: string) => { keyword = val }"
            placeholder="検索 (Ctrl+F)"
            style="max-width: 280px" size="small"
          />
          <!-- CSVインポート用ファイル選択（非表示） -->
          <input ref="fileInput" type="file" accept=".csv,text/csv" style="display:none" v-on:change="onFileChange" />
          <!-- インポートボタン -->
          <el-button size="small" v-on:click="triggerImport">インポート</el-button>
          <!-- エクスポートボタン -->
          <el-button size="small" v-on:click="onExport">CSVエクスポート</el-button>
          <!-- Markdownエクスポートボタン -->
          <el-button size="small" v-on:click="onExportMarkdown">Markdownエクスポート</el-button>
          <!-- 保存ボタン -->
          <el-button type="primary" size="small" v-on:click="save">保存</el-button>
                  <!-- データベース初期化ボタン -->
                  <el-button type="danger" size="small" v-on:click="onInitDatabase">データベース初期化</el-button>
        </el-col>
      </el-row>
    </el-header>
    <!-- サイドバー＋メインエリア -->
    <el-container>
      <!-- サイドバー：問題ツリー -->
  <el-aside width="var(--el-aside-width)" style="border-right: 1px solid var(--el-border-color)">
        <question-tree v-bind:questions="filtered" v-bind:selected-id="selectedId" v-on:select="select" />
      </el-aside>
      <!-- メインエリア：問題エディタ or 空表示 -->
      <el-main>
        <question-editor v-if="selected" v-bind:key="selectedKey" v-bind:question="selected" v-on:update="onUpdate" />
        <div v-else class="empty">テスト問題がありません</div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useQuestionsStore } from './stores/questions'
import QuestionTree from './components/QuestionTree.vue'
import QuestionEditor from './components/QuestionEditor.vue'
import { getDatabase } from './utils/sqlite'


// 質問データストア
const store = useQuestionsStore()
// 検索キーワード
const keyword = ref('')
// 選択中の問題ID
const selectedId = ref<number | null>(null)
// 検索ボックス参照
const searchRef = ref()
// ファイルインプット参照
const fileInput = ref<HTMLInputElement | null>(null)


// 初期化処理：データロードとショートカット登録
onMounted(async () => {
  await store.load()
  window.addEventListener('keydown', onKey)
})


// クリーンアップ：ショートカット解除
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})


// 検索キーワードでフィルタした問題リスト
const filtered = computed(() => store.filter(keyword.value))
// 選択中の問題データ
const selected = computed(() => (selectedId.value != null ? store.getById(selectedId.value) : null))
// 問題エディタのkey（再描画用）
const selectedKey = computed(() => (selectedId.value != null ? `q-${selectedId.value}` : undefined))


// 問題ツリーで選択時の処理
function select(id: number) {
  selectedId.value = id
}


// 問題エディタからの更新イベント
function onUpdate(payload: any) {
  if (selectedId.value != null) {
    store.update(selectedId.value, payload)
  }
}


// インポートボタン押下時：ファイル選択ダイアログを開く
function triggerImport() {
  if (fileInput.value) {
    fileInput.value.click()
  }
}


// ファイル選択時：CSVインポート処理
async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  if (!file) return
  try {
    const text = await file.text()
    await store.importCSV(text)
  } catch (error: any) {
    window.alert('CSVインポートに失敗しました: ' + (error?.message || error))
    console.error('CSVインポートエラー:', error)
  }
  input.value = ''
}


// エクスポートボタン押下時：CSVダウンロード処理
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


// Markdownエクスポートボタン押下時：Markdownエクスポート処理
async function onExportMarkdown() {
  try {
    await store.exportMarkdown()
    window.alert('Markdownエクスポートが完了しました。')
  } catch (error: any) {
    window.alert('Markdownエクスポートに失敗しました: ' + (error?.message || error))
  }
}

// 保存ボタン押下時：データ保存処理
async function save() {
  await store.save()
}

// データベース初期化ボタン処理
async function onInitDatabase() {
  try {
    await ElMessageBox.confirm(
      '本当にデータベースを初期化（削除）しますか？この操作は元に戻せません。',
      '確認',
      {
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル',
        type: 'warning',
        closeOnClickModal: false,
        closeOnPressEscape: false,
      }
    )
  } catch {
    // キャンセル時は何もしない
    return
  }
  try {
    // LocalStorageのDBデータを削除
    localStorage.removeItem('sqlite_db_data')
    // ストアのメモリ上データもクリア
    store.items = []
    store.dirty = false
    // SQLiteManagerのインスタンスを再初期化
    const db = await getDatabase()
    await db.initialize()
    await store.load()
    window.alert('データベースを初期化しました。')
  } catch (error: any) {
    window.alert('データベース初期化に失敗しました: ' + (error?.message || error))
    console.error('データベース初期化エラー:', error)
  }
}

// ショートカットキー処理
function onKey(e: KeyboardEvent) {
  // Ctrl+F: 検索ボックスにフォーカス
  if (e.ctrlKey && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    if (searchRef.value && typeof searchRef.value.focus === 'function') {
      searchRef.value.focus()
    }
  }
  // Ctrl+S: 保存
  if (e.ctrlKey && e.key.toLowerCase() === 's') {
    e.preventDefault()
    save()
  }
}
</script>

<style>
body, html { margin: 0; }
.empty { color: #999; padding: 24px; }
/* Prevent LaTeX (KaTeX/MathML) from being vertically clipped in tight line boxes */
mjx-container { overflow: visible !important; }
/* Slightly relax line-height for containers that include formulas */
.math-content, mjx-container * { line-height: 1.2; }
</style>
