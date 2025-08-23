import initSqlJs from 'sql.js'
import type { Question } from '../types'

// SQLite データベース管理クラス
export class SQLiteManager {
  private db: any = null
  private SQL: any = null

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
        difficulty INTEGER NOT NULL DEFAULT 1,
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

    // データベースをバイナリデータとしてエクスポート
    const data = this.db.export()
    // Base64エンコードしてLocalStorageに保存
    const base64Data = btoa(String.fromCharCode(...data))
    localStorage.setItem('sqlite_db_data', base64Data)
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
        difficulty: row.difficulty as number,
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
      for (const question of questions) {
        stmt.run([
          question.id,
          question.for_quiz ? 1 : 0,
          question.for_exam ? 1 : 0,
          question.difficulty,
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
      }
      stmt.free()

      // コミット
      this.db.run('COMMIT')

      // ファイルに保存
      await this.saveDatabase()
    } catch (error) {
      // エラー時はロールバック
      this.db.run('ROLLBACK')
      throw error
    }
  }

  // 特定の問題を更新
  async updateQuestion(id: number, updates: Partial<Question>): Promise<void> {
    if (!this.db) throw new Error('データベースが初期化されていません')

    // 更新するフィールドを動的に構築
    const updateFields: string[] = []
    const values: any[] = []

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        updateFields.push(`${key} = ?`)
        if (key === 'for_quiz' || key === 'for_exam') {
          values.push(value ? 1 : 0)
        } else {
          values.push(value)
        }
      }
    })

    if (updateFields.length === 0) return

    values.push(id) // WHERE句のため
    const updateSQL = `UPDATE questions SET ${updateFields.join(', ')} WHERE id = ?`

    this.db.run(updateSQL, values)
    await this.saveDatabase()
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