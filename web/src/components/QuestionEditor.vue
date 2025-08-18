<template>
  <div>
    <el-form :model="local" label-width="140px">
      <el-form-item label="確認テスト利用*"><el-switch v-model="local.for_quiz" /></el-form-item>
      <el-form-item label="単位認定試験利用*"><el-switch v-model="local.for_exam" /></el-form-item>
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
      <el-form-item label="問題文*"><el-input v-model="local.text" type="textarea" rows="5" /></el-form-item>
      <el-form-item label="選択肢A*"><el-input v-model="local.choiceA" /></el-form-item>
      <el-form-item label="選択肢B*"><el-input v-model="local.choiceB" /></el-form-item>
      <el-form-item label="選択肢C*"><el-input v-model="local.choiceC" /></el-form-item>
      <el-form-item label="選択肢D*"><el-input v-model="local.choiceD" /></el-form-item>
      <el-form-item label="正解*">
        <el-select v-model="local.answer" style="width: 120px">
          <el-option label="A" value="A" />
          <el-option label="B" value="B" />
          <el-option label="C" value="C" />
          <el-option label="D" value="D" />
        </el-select>
      </el-form-item>
      <el-form-item label="解説*"><el-input v-model="local.explanation" type="textarea" rows="5" /></el-form-item>
      <el-form-item label="メモ"><el-input v-model="local.memo" type="textarea" rows="3" /></el-form-item>
    </el-form>
    <el-divider />
    <h4>プレビュー</h4>
    <mathjax-preview :content="previewText" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { Question } from '../types'
import MathjaxPreview from './MathjaxPreview.vue'

const props = defineProps<{ question: Question }>()
const emit = defineEmits<{ (e: 'update', q: Partial<Question>): void }>()

const local = reactive({ ...props.question })

watch(local, () => emit('update', { ...local }), { deep: true })

const previewText = computed(() =>
  `問題: ${local.text}\n\nA) ${local.choiceA}\nB) ${local.choiceB}\nC) ${local.choiceC}\nD) ${local.choiceD}\n\n解説: ${local.explanation}`,
)
</script>
