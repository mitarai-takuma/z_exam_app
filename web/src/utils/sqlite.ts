import initSqlJs from 'sql.js'
import type { Question, Difficulty } from '../types'
import { DIFFICULTY_VALUES } from '../types'

// SQLite データベース管理クラス
export class SQLiteManager {
  private db: any = null
  private SQL: any = null
  // 難易度の正規化（指定の4ラベルへ正規化）
  private sanitizeDifficulty(value: any): Difficulty {
    // すでに正しいラベル
    if (typeof value === 'string') {
      // 完全一致
      if ((DIFFICULTY_VALUES as readonly string[]).includes(value)) {
        return value as Difficulty
      }
      // 先頭の数字から推定
      const m = value.match(/^\s*([1-4])/)
      if (m) {
        const idx = Number(m[1]) as 1 | 2 | 3 | 4
        return DIFFICULTY_VALUES[idx - 1]
      }
    }
    // 数値からのマッピング（レガシーINTEGERカラム対策）
    const n = Number(value)
    if (!Number.isNaN(n)) {
      const c = n < 1 ? 1 : n > 4 ? 4 : Math.round(n)
      return DIFFICULTY_VALUES[c - 1]
    }
    // 不明な値は最も易しいラベルにフォールバック
    return DIFFICULTY_VALUES[0]
  }
  // 成功・失敗メッセージ整形のためのユーティリティ
  private logSaveSuccess(round: number, section: number, id: number): void {
    // 例: 3-2の#15を保存しました
    console.log(`${round}-${section}の#${id}を保存しました`)
  }

  // データベースの初期化
  async initialize(): Promise<void> {
    if (this.SQL) return

    // sql.js ライブラリを初期化
    this.SQL = await initSqlJs({
      locateFile: (file: string) => `/${file}`
    })

    // 既存のデータベースファイルをLocalStorageから読み込み、または新規作成
    const savedDB = localStorage.getItem('sqlite_db_data')
    if (savedDB) {
      // Base64でエンコードされたデータベースを復元
      const dbData = Uint8Array.from(atob(savedDB), c => c.charCodeAt(0))
      this.db = new this.SQL.Database(dbData)
    } else {
      // 新しいデータベースを作成
      this.db = new this.SQL.Database()
    }

    // テーブルが存在しない場合は作成
    this.createTables()
  }

  // テーブル作成
  private createTables(): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY,
        for_quiz BOOLEAN NOT NULL DEFAULT 0,
        for_exam BOOLEAN NOT NULL DEFAULT 0,
        difficulty TEXT NOT NULL DEFAULT '1(90％程度正答)',
        round INTEGER NOT NULL,
        section INTEGER NOT NULL,
        text TEXT NOT NULL DEFAULT '',
        choiceA TEXT NOT NULL DEFAULT '',
        choiceB TEXT NOT NULL DEFAULT '',
        choiceC TEXT NOT NULL DEFAULT '',
        choiceD TEXT NOT NULL DEFAULT '',
        answer TEXT NOT NULL DEFAULT 'A',
        explanation TEXT NOT NULL DEFAULT '',
        memo TEXT DEFAULT ''
      )
    `
    this.db.run(createTableSQL)
  }

  // データベースファイルをLocalStorageに保存
  async saveDatabase(): Promise<void> {
    if (!this.db) throw new Error('データベースが初期化されていません')

    try {
      // データベースをバイナリデータとしてエクスポート
      const data = this.db.export()
      // Base64エンコードしてLocalStorageに保存（安全な方法で変換）
      let binary = ''
      for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i])
      }
      const base64Data = btoa(binary)
      localStorage.setItem('sqlite_db_data', base64Data)
    } catch (e: any) {
      // LocalStorage容量不足やシリアライズ失敗などの原因を判別
      let reason = '不明な理由'
      if (e && typeof e === 'object') {
        if (e.name === 'QuotaExceededError') {
          reason = 'ブラウザの保存領域（LocalStorage）の空き容量不足'
        } else if (e.message) {
          reason = e.message
        }
      }
      throw new Error(`データベース保存に失敗しました（原因: ${reason}）`)
    }
  }

  // 全ての問題データを取得
  async getAllQuestions(): Promise<Question[]> {
    if (!this.db) throw new Error('データベースが初期化されていません')

  const stmt = this.db.prepare('SELECT * FROM questions ORDER BY round, section, id')
  const questions: Question[] = []

    while (stmt.step()) {
      const row = stmt.getAsObject()
      questions.push({
        id: row.id as number,
        for_quiz: Boolean(row.for_quiz),
        for_exam: Boolean(row.for_exam),
        difficulty: this.sanitizeDifficulty(row.difficulty),
        round: row.round as number,
        section: row.section as number,
        text: row.text as string,
        choiceA: row.choiceA as string,
        choiceB: row.choiceB as string,
        choiceC: row.choiceC as string,
        choiceD: row.choiceD as string,
        answer: row.answer as 'A' | 'B' | 'C' | 'D',
        explanation: row.explanation as string,
        memo: row.memo as string
      })
    }
    stmt.free()

    return questions
  }

  // 問題データを保存（全データを上書き）
  async saveAllQuestions(questions: Question[]): Promise<void> {
    if (!this.db) throw new Error('データベースが初期化されていません')

    // トランザクション開始
    this.db.run('BEGIN TRANSACTION')
    let committed = false
    try {
      // 既存データを削除
      this.db.run('DELETE FROM questions')

      // 新しいデータを挿入
      const insertSQL = `
        INSERT INTO questions (
          id, for_quiz, for_exam, difficulty, round, section,
          text, choiceA, choiceB, choiceC, choiceD, answer, explanation, memo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      const stmt = this.db.prepare(insertSQL)
      try {
        for (const question of questions) {
          try {
            stmt.run([
              question.id,
              question.for_quiz ? 1 : 0,
              question.for_exam ? 1 : 0,
              this.sanitizeDifficulty(question.difficulty),
              question.round,
              question.section,
              question.text,
              question.choiceA,
              question.choiceB,
              question.choiceC,
              question.choiceD,
              question.answer,
              question.explanation,
              question.memo || ''
            ])
          } catch (rowErr: any) {
            // どの行でエラーが発生したかを明示
            const cause = rowErr && rowErr.message ? rowErr.message : '不明なSQLエラー'
            throw new Error(`保存処理中にエラーが発生しました（対象: ${question.round}-${question.section}の#${question.id}、原因: ${cause}）`)
          }
        }
      } finally {
        stmt.free()
      }

      // コミット
      this.db.run('COMMIT')
      committed = true

      // ファイルに保存
      await this.saveDatabase()

      // 成功ログ（各問題ごと）
      for (const q of questions) {
        this.logSaveSuccess(q.round, q.section, q.id)
      }
    } catch (error) {
      // エラー時はロールバック（コミット済みなら不要）
      if (!committed) {
        try {
          this.db.run('ROLLBACK')
        } catch (rollbackErr) {
          // ROLLBACK失敗は握りつぶす
        }
      }
      // エラー内容を詳細にして再スロー
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('データベース保存に失敗しました')) {
        throw error
      }
      throw new Error(`データベース保存に失敗しました（原因: ${msg}）`)
    }
  }

  // 特定の問題を更新
  async updateQuestion(id: number, updates: Partial<Question>): Promise<void> {
    if (!this.db) throw new Error('データベースが初期化されていません')

    // 既存の行を取得して存在確認＆ログ用情報を取得
    const findStmt = this.db.prepare('SELECT id, round, section FROM questions WHERE id = ?')
    let current: { id: number; round: number; section: number } | null = null
    try {
      findStmt.bind([id])
      if (findStmt.step()) {
        const row = findStmt.getAsObject() as any
        current = { id: row.id as number, round: row.round as number, section: row.section as number }
      }
    } finally {
      findStmt.free()
    }

    if (!current) {
      throw new Error(`更新対象が見つかりません（ID: ${id}）`)
    }

    // 更新するフィールドを動的に構築
    const updateFields: string[] = []
    const values: any[] = []

  Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        updateFields.push(`${key} = ?`)
        if (key === 'for_quiz' || key === 'for_exam') {
          values.push(value ? 1 : 0)
        } else if (key === 'difficulty') {
      values.push(this.sanitizeDifficulty(value))
        } else {
          values.push(value)
        }
      }
    })

    if (updateFields.length === 0) {
      // 何も更新しない場合でも成功扱いとして明示ログのみ出す
      this.logSaveSuccess(current.round, current.section, current.id)
      await this.saveDatabase()
      return
    }

    values.push(id) // WHERE句のため
    const updateSQL = `UPDATE questions SET ${updateFields.join(', ')} WHERE id = ?`

    try {
      this.db.run('BEGIN TRANSACTION')
      this.db.run(updateSQL, values)
      this.db.run('COMMIT')
    } catch (e: any) {
      this.db.run('ROLLBACK')
      const cause = e && e.message ? e.message : '不明なSQLエラー'
      throw new Error(`更新に失敗しました（対象: ${current.round}-${current.section}の#${current.id}、原因: ${cause}）`)
    }

    // 保存（LocalStorage反映）
    await this.saveDatabase()

    // ラウンド・セクションは更新後の値を優先
    const newRound = (updates.round as number | undefined) ?? current.round
    const newSection = (updates.section as number | undefined) ?? current.section
    this.logSaveSuccess(newRound, newSection, current.id)
  }
}

// シングルトンインスタンス
let dbInstance: SQLiteManager | null = null

// データベースインスタンスを取得
export async function getDatabase(): Promise<SQLiteManager> {
  if (!dbInstance) {
    dbInstance = new SQLiteManager()
    await dbInstance.initialize()
  }
  return dbInstance
}