import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity({ name: 'questions' })
export class QuestionEntity {
  @PrimaryColumn('integer')
  id!: number

  @Column('boolean')
  for_quiz!: boolean

  @Column('boolean')
  for_exam!: boolean

  @Column('integer')
  difficulty!: number

  @Column('integer')
  round!: number

  @Column('integer')
  section!: number

  @Column('text')
  text!: string

  @Column('text')
  choiceA!: string

  @Column('text')
  choiceB!: string

  @Column('text')
  choiceC!: string

  @Column('text')
  choiceD!: string

  @Column('varchar')
  answer!: 'A' | 'B' | 'C' | 'D'

  @Column('text')
  explanation!: string

  @Column('text', { nullable: true })
  memo?: string
}
