import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user';
import { Answer } from './answer';

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  role: string;

  @Column()
  content: string;

  @Column()
  difficulty: string;

  @ManyToOne(() => User, (user) => user.questions)
  user: User;

  @OneToMany(() => Answer, (a) => a.question)
  answers: Answer[];
}
