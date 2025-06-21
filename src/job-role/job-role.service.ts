import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreateQuestionDto } from './dto/create-question.dto';
import { EvaluateAnswerDto } from './dto/evaluate-answer.dto';

@Injectable()
export class JobRoleService {
  private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(private configService: ConfigService) {}

  async generateQuestions(dto: CreateQuestionDto): Promise<string> {
    const prompt = this.buildPrompt(dto);

    const res = await axios.post(
      this.apiUrl,
      {
        model: 'deepseek/deepseek-r1:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('OPENROUTER_API_KEY')}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'AI Interview Question Generator',
        },
      },
    );

    return res.data.choices[0]?.message?.content || 'No response';
  }

  async evaluateAnswer(dto: EvaluateAnswerDto): Promise<string> {
    const prompt = `You are an expert interviewer. Evaluate the following answer for a candidate applying as ${
      dto.role || 'a software engineer'
    }.

Question: ${dto.question}

Answer: ${dto.userAnswer}

Provide an honest, constructive evaluation in 4–6 sentences. Include strengths, weaknesses, and tips for improvement.`;

    const res = await axios.post(
      this.apiUrl,
      {
        model: 'deepseek/deepseek-r1:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('OPENROUTER_API_KEY')}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'AI Interview Question Generator',
        },
      },
    );

    return res.data.choices[0]?.message?.content || 'No evaluation available';
  }

  private buildPrompt(dto: CreateQuestionDto): string {
    const difficulty = dto.difficulty || 'medium';
    const count = dto.numberOfQuestions || 5;

    return `Generate ${count} ${difficulty} interview questions for the job role of ${dto.role}. Format the response in a readable list.`;
  }
}
