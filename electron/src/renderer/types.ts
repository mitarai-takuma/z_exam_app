export type Answer = 'A' | 'B' | 'C' | 'D'

export interface Question {
  id: number
  for_quiz: boolean
  for_exam: boolean
  difficulty: number // 1-4
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
