import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreateQuestionDto } from './dto/create-question.dto';

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

  private buildPrompt(dto: CreateQuestionDto): string {
    const difficulty = dto.difficulty || 'medium';
    const count = dto.numberOfQuestions || 5;

    return `Generate ${count} ${difficulty} interview questions for the job role of ${dto.role}. Format the response in a readable list.`;
  }
}
