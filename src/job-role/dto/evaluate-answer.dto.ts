export class EvaluateAnswerDto {
  question: string;
  userAnswer?: string;
  answer?: string; // Frontend sends 'answer' instead of 'userAnswer'
  role?: string;
}
