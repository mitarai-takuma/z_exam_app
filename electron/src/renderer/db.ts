import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { QuestionEntity } from './entities/QuestionEntity'

export const AppDataSource = new DataSource({
  type: 'sqljs',
  autoSave: true,
  location: 'z_exam_app_db',
  synchronize: true,
  logging: false,
  entities: [QuestionEntity],
})

export async function getDb() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }
  return AppDataSource
}
