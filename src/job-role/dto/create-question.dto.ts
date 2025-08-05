export class CreateQuestionDto {
  role: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  numberOfQuestions?: number;
}

export class GetNextQuestionDto {
  role: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  numberOfQuestions?: number;
}
