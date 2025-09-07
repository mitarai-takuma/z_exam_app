export type Answer = '選択肢A' | '選択肢B' | '選択肢C' | '選択肢D'
// 想定難易度: 1(90％程度正答) | 2(70％程度正答) | 3(50％程度正答) | 4(30％程度正答) のみ許可
// Difficulty type: labeled strings as per specification
export const DIFFICULTY_VALUES = [
  "1(90％程度正答)",
  "2(70％程度正答)",
  "3(50％程度正答)",
  "4(30％程度正答)",
] as const
export type Difficulty = typeof DIFFICULTY_VALUES[number]

export interface Question {
  id: number
  for_quiz: boolean
  for_exam: boolean
  difficulty: Difficulty
  round: number // 1-15
  section: number // 1-6
  text: string
  choiceA: string
  choiceB: string
  choiceC: string
  choiceD: string
  answer: Answer
  explanation: string
  memo?: string
}
