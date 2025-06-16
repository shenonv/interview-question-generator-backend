export class CreateQuestionDto {
  role: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  numberOfQuestions?: number;
}
