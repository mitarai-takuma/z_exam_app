import { defineStore } from 'pinia'
import type { Question } from '../types'
import { DIFFICULTY_VALUES } from '../types'
import { parse as csvParse } from 'csv-parse/browser/esm/sync'
import { stringify as csvStringify } from 'csv-stringify/browser/esm/sync'
import { getDatabase } from '../utils/sqlite'

// 旧localStorage用のキー（マイグレーション用）
const LEGACY_STORAGE_KEY = 'z_exam_app_questions_v1'

function genId(items: Question[]) {
  return (items.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1
}

export const useQuestionsStore = defineStore('questions', {
  state: () => ({
    items: [] as Question[],
    dirty: false,
  }),
  actions: {
    // 難易度の正規化（4つのラベルへ）
    sanitizeDifficulty(value: any): Question['difficulty'] {
      if (typeof value === 'string') {
        if ((DIFFICULTY_VALUES as readonly string[]).includes(value)) {
          return value as Question['difficulty']
        }
        const m = value.match(/^\s*([1-4])/)
        if (m) {
          const idx = Number(m[1]) as 1 | 2 | 3 | 4
          return DIFFICULTY_VALUES[idx - 1] as Question['difficulty']
        }
      }
      const n = Number(value)
      if (!Number.isNaN(n)) {
        const c = n < 1 ? 1 : n > 4 ? 4 : Math.round(n)
        return DIFFICULTY_VALUES[c - 1] as Question['difficulty']
      }
      return DIFFICULTY_VALUES[0] as Question['difficulty']
    },
    // SQLiteからデータを読み込み
    async load() {
      try {
        const db = await getDatabase()
        const questions = await db.getAllQuestions()
        
        // SQLiteにデータがない場合、localStorage からマイグレーション
        if (questions.length === 0) {
          await this.migrateLegacyData()
          // マイグレーション後に再度読み込み
          const migratedQuestions = await db.getAllQuestions()
          this.items = migratedQuestions
        } else {
          this.items = questions
        }
        
        console.log('SQLiteデータベースからデータを読み込みました:', this.items.length, '件')
      } catch (error) {
        console.error('データ読み込みエラー:', error)
        this.items = []
      }
    },
    
    // 旧localStorageデータをSQLiteに移行
    async migrateLegacyData() {
      try {
        const rawData = localStorage.getItem(LEGACY_STORAGE_KEY)
        if (rawData) {
          const legacyQuestions = JSON.parse(rawData) as Question[]
          console.log('localStorageから', legacyQuestions.length, '件のデータを移行します')
          
          const db = await getDatabase()
          await db.saveAllQuestions(legacyQuestions)
          
          // 移行完了後、localStorageから削除
          localStorage.removeItem(LEGACY_STORAGE_KEY)
          console.log('データ移行が完了しました')
        }
      } catch (error) {
        console.error('データ移行エラー:', error)
      }
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
    // 問題データの更新
    update(id: number, patch: Partial<Question>) {
      const i = this.items.findIndex((x) => x.id === id)
      if (i >= 0) {
        this.items[i] = { ...this.items[i], ...patch }
        this.dirty = true
        
        // SQLiteにも即座に反映（オプション）
        // このコメントアウトを外すと、編集時に即座にSQLiteに保存されます
        // this.updateQuestionInDB(id, patch)
      }
    },
    
    // データベースの特定問題を更新
    async updateQuestionInDB(id: number, patch: Partial<Question>) {
      try {
        const db = await getDatabase()
        await db.updateQuestion(id, patch)
      } catch (error) {
        console.error('問題データ更新エラー:', error)
      }
    },
    
    // SQLiteにデータを保存
    async save() {
      try {
        const db = await getDatabase()
        await db.saveAllQuestions(this.items)
        this.dirty = false
        console.log('SQLiteデータベースにデータを保存しました:', this.items.length, '件')
      } catch (error) {
        console.error('データ保存エラー:', error)
        throw error
      }
    },
    // CSVファイルからデータをインポート（SQLiteデータを上書き）
    async importCSV(text?: string) {
      if (!text) return
      
      try {
        const records = csvParse(text, { columns: true, skip_empty_lines: true }) as any[]
        const importedQuestions: Question[] = []
        
  for (const r of records) {
          // 回・セクション情報がない行はスキップ
          const roundRaw = r['回']
          const sectionRaw = r['セクション']
          const roundNum = Number(roundRaw)
          const sectionNum = Number(sectionRaw)
          if (
            roundRaw == null || sectionRaw == null || String(roundRaw).trim() === '' || String(sectionRaw).trim() === '' ||
            Number.isNaN(roundNum) || Number.isNaN(sectionNum)
          ) {
            continue
          }
          
          const q: Question = {
            id: Number(r['ID'] || genId(importedQuestions)),
            for_quiz: r['確認テスト利用'] === 'true' || r['確認テスト利用'] === '1' || r['確認テスト利用'] === true,
            for_exam: r['単位認定試験利用'] === 'true' || r['単位認定試験利用'] === '1' || r['単位認定試験利用'] === true,
            difficulty: this.sanitizeDifficulty(r['想定難易度'] ?? r['難易度'] ?? DIFFICULTY_VALUES[0]),
            round: roundNum,
            section: sectionNum,
            text: String(r['問題文'] || ''),
            choiceA: String(r['選択肢A'] || ''),
            choiceB: String(r['選択肢B'] || ''),
            choiceC: String(r['選択肢C'] || ''),
            choiceD: String(r['選択肢D'] || ''),
            answer: (['A', 'B', 'C', 'D'].includes(String(r['正解'])) ? (String(r['正解']) as any) : 'A') as Question['answer'],
            explanation: String(r['正解に対する解説'] || r['解説'] || ''),
            memo: String(r['メモ'] || ''),
          }
          
          // 重複IDをチェックして追加
          if (!importedQuestions.some((x) => x.id === q.id)) {
            importedQuestions.push(q)
          }
        }
        
        // メモリ上のデータを更新
        this.items = importedQuestions
        this.dirty = true
        
        // SQLiteデータベースを上書き保存
        const db = await getDatabase()
        await db.saveAllQuestions(importedQuestions)
        this.dirty = false
        
        console.log('CSVからインポートしてSQLiteデータベースを上書きしました:', importedQuestions.length, '件')
      } catch (error) {
        console.error('CSVインポートエラー:', error)
        throw error
      }
    },
    // CSVファイルへのエクスポート
    async exportCSV() {
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
      console.log('CSVデータをエクスポートしました:', this.items.length, '件')
      return data
    },
  },
})
