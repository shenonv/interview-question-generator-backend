import { Controller, Post, Body } from '@nestjs/common';
import { JobRoleService } from './job-role.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { EvaluateAnswerDto } from './dto/evaluate-answer.dto';

@Controller('job-role')
export class JobRoleController {
  constructor(private readonly jobRoleService: JobRoleService) {}

  @Post('questions')
  async generateQuestions(@Body() dto: CreateQuestionDto) {
    const questions = await this.jobRoleService.generateQuestions(dto);
    return { questions };
  }

  @Post('evaluate')
  async evaluateAnswer(@Body() dto: EvaluateAnswerDto) {
    const evaluation = await this.jobRoleService.evaluateAnswer(dto);
    return { evaluation };
  }
}
