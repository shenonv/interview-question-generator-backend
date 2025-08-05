import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Question } from './question';

@Entity()
export class Answer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userAnswer: string;

  @Column()
  aiEvaluation: string;

  @ManyToOne(() => Question, (question) => question.answers)
  question: Question;
}
