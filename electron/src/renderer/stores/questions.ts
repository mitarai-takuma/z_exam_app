import { defineStore } from 'pinia'
import type { Question } from '../types'
import { getDb } from '../db'
import { QuestionEntity } from '../entities/QuestionEntity'
import { parse as csvParse } from 'csv-parse/browser/esm/sync'
import { stringify as csvStringify } from 'csv-stringify/browser/esm/sync'

function genId(items: Question[]) {
  return (items.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1
}

export const useQuestionsStore = defineStore('questions', {
  state: () => ({
    items: [] as Question[],
    dirty: false,
  }),
  actions: {
    async load() {
  const db = await getDb()
  const repo = db.getRepository(QuestionEntity)
  const all = await repo.find()
  this.items = all.map((e) => ({ ...e }))
    },
    getById(id: number) {
      return this.items.find((x) => x.id === id) || null
    },
    filter(keyword: string) {
      const k = keyword.trim()
      if (!k) return this.items
      return this.items.filter((q) =>
        [q.text, q.choiceA, q.choiceB, q.choiceC, q.choiceD, q.explanation].some((s) => s.includes(k)),
      )
    },
    update(id: number, patch: Partial<Question>) {
      const i = this.items.findIndex((x) => x.id === id)
      if (i >= 0) {
        this.items[i] = { ...this.items[i], ...patch }
        this.dirty = true
      }
    },
    async save() {
  const db = await getDb()
  const repo = db.getRepository(QuestionEntity)
  await repo.clear()
  await repo.save(this.items)
  this.dirty = false
    },
    async importCSV() {
      const file = await window.api.openCSV()
      if (!file) return
      const text = await window.api.readFile(file, 'utf-8')
      const records = csvParse(text, { columns: true, skip_empty_lines: true }) as any[]
      for (const r of records) {
        const q: Question = {
          id: Number(r['ID'] || genId(this.items)),
          for_quiz: r['確認テスト利用'] === 'true' || r['確認テスト利用'] === '1' || r['確認テスト利用'] === true,
          for_exam:
            r['単位認定試験利用'] === 'true' || r['単位認定試験利用'] === '1' || r['単位認定試験利用'] === true,
          difficulty: Number(r['想定難易度'] || r['難易度'] || 1),
          round: Number(r['回'] || 1),
          section: Number(r['セクション'] || 1),
          text: String(r['問題文'] || ''),
          choiceA: String(r['選択肢A'] || ''),
          choiceB: String(r['選択肢B'] || ''),
          choiceC: String(r['選択肢C'] || ''),
          choiceD: String(r['選択肢D'] || ''),
          answer: (['A', 'B', 'C', 'D'].includes(String(r['正解']))
            ? (String(r['正解']) as any)
            : 'A') as Question['answer'],
          explanation: String(r['正解に対する解説'] || r['解説'] || ''),
          memo: String(r['メモ'] || ''),
        }
        if (!this.items.some((x) => x.id === q.id)) this.items.push(q)
      }
      this.dirty = true
    },
    async exportCSV() {
      const file = await window.api.saveCSV()
      if (!file) return
      const data = csvStringify(
        this.items.map((q) => ({
          確認テスト利用: q.for_quiz ? 1 : 0,
          単位認定試験利用: q.for_exam ? 1 : 0,
          ID: q.id,
          想定難易度: q.difficulty,
          回: q.round,
          セクション: q.section,
          問題文: q.text,
          選択肢A: q.choiceA,
          選択肢B: q.choiceB,
          選択肢C: q.choiceC,
          選択肢D: q.choiceD,
          正解: q.answer,
          正解に対する解説: q.explanation,
        })),
        { header: true },
      )
      await window.api.writeFile(file, data, 'utf-8')
    },
  },
})
