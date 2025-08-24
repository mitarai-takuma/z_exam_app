<template>
  <div>
    <el-form :model="local" label-width="140px">
      <!-- 利用フラグ -->
      <el-form-item label="確認テスト利用*">
        <el-switch v-model="local.for_quiz" />
      </el-form-item>
      <el-form-item label="単位認定試験利用*">
        <el-switch v-model="local.for_exam" />
      </el-form-item>

      <!-- メタ情報 -->
      <el-form-item label="難易度*">
        <el-select v-model="local.difficulty" style="width: 120px">
          <el-option v-for="n in 4" :key="n" :label="n" :value="n" />
        </el-select>
      </el-form-item>
      <el-form-item label="回*">
        <el-select v-model="local.round" style="width: 120px">
          <el-option v-for="n in 15" :key="n" :label="n" :value="n" />
        </el-select>
      </el-form-item>
      <el-form-item label="セクション*">
        <el-select v-model="local.section" style="width: 120px">
          <el-option v-for="n in 6" :key="n" :label="n" :value="n" />
        </el-select>
      </el-form-item>

      <!-- 問題文: 編集欄の直下にプレビュー -->
      <el-form-item label="問題文*">
        <el-input v-model="local.text" type="textarea" rows="5" />
      </el-form-item>
      <el-form-item label="プレビュー" class="inline-preview-item">
        <div class="inline-preview">
          <markdown-katex-preview :content="local.text || ''" />
        </div>
      </el-form-item>

      <!-- 選択肢: A〜Dの直下にまとめてプレビュー -->
      <el-form-item label="選択肢A*">
        <el-input v-model="local.choiceA" />
      </el-form-item>
      <el-form-item label="選択肢B*">
        <el-input v-model="local.choiceB" />
      </el-form-item>
      <el-form-item label="選択肢C*">
        <el-input v-model="local.choiceC" />
      </el-form-item>
      <el-form-item label="選択肢D*">
        <el-input v-model="local.choiceD" />
      </el-form-item>
      <el-form-item label="選択肢プレビュー" class="inline-preview-item">
        <div class="inline-preview">
          <div class="choices">
            <div class="choice-row">
              <span class="choice-label">A</span>
              <markdown-katex-preview :content="local.choiceA || ''" />
            </div>
            <div class="choice-row">
              <span class="choice-label">B</span>
              <markdown-katex-preview :content="local.choiceB || ''" />
            </div>
            <div class="choice-row">
              <span class="choice-label">C</span>
              <markdown-katex-preview :content="local.choiceC || ''" />
            </div>
            <div class="choice-row">
              <span class="choice-label">D</span>
              <markdown-katex-preview :content="local.choiceD || ''" />
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- 正解: セレクト直下にプレビュー -->
      <el-form-item label="正解*">
        <el-select v-model="local.answer" style="width: 120px">
          <el-option label="A" value="A" />
          <el-option label="B" value="B" />
          <el-option label="C" value="C" />
          <el-option label="D" value="D" />
        </el-select>
      </el-form-item>

      <!-- 解説: 編集欄の直下にプレビュー -->
      <el-form-item label="解説*">
        <el-input v-model="local.explanation" type="textarea" rows="5" />
      </el-form-item>
      <el-form-item label="プレビュー" class="inline-preview-item">
        <div class="inline-preview">
          <markdown-katex-preview :content="local.explanation || ''" />
        </div>
      </el-form-item>

      <!-- メモ（プレビュー不要） -->
      <el-form-item label="メモ">
        <el-input v-model="local.memo" type="textarea" rows="3" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Question } from '../types'
import MarkdownKatexPreview from './MarkdownKatexPreview.vue'

// props/emit 定義
const props = defineProps<{ question: Question }>()
const emit = defineEmits<{ (e: 'update', q: Partial<Question>): void }>()

// フォーム用のローカル状態
const local = reactive({ ...props.question })

// 選択中の問題が変更されたらフォームへ反映
watch(
  () => props.question,
  (q) => {
    Object.assign(local, q)
  },
)

// フォームの変更を親へ通知
watch(local, () => emit('update', { ...local }), { deep: true })
</script>

<style scoped>
/* インラインプレビューの見た目調整 */
.inline-preview-item :deep(.el-form-item__label) {
  color: var(--el-text-color-secondary);
}
.inline-preview {
  padding: 12px; /* 3 * 4px */
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

/* 選択肢の行レイアウト */
.choices {
  display: flex;
  flex-direction: column;
  gap: 12px; /* 3 * 4px */
}
.choice-row {
  display: grid;
  grid-template-columns: 32px 1fr; /* ラベル + 本文 */
  align-items: start;
  gap: 8px;
}
.choice-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: var(--el-color-info-light-7);
  color: var(--el-color-info);
  font-weight: 600;
}

/* 正解 */
.answer-inline {
  font-size: 18px;
  font-weight: 700;
}
</style>
