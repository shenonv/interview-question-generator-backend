import { Controller, Post, Body, Get } from '@nestjs/common';
import { JobRoleService } from './job-role.service';
import { CreateQuestionDto, GetNextQuestionDto } from './dto/create-question.dto';
import { EvaluateAnswerDto } from './dto/evaluate-answer.dto';

@Controller('job-role')
export class JobRoleController {
  constructor(private readonly jobRoleService: JobRoleService) {}

  @Get('roles')
  async getJobRoles() {
    try {
      const roles = await this.jobRoleService.getJobRoles();
      return { roles, count: roles.length };
    } catch (error) {
      console.error('Error in getJobRoles controller:', error);
      return { roles: [], count: 0, error: error.message };
    }
  }

  @Post('roles')
  async createJobRole(@Body() body: { name: string; description?: string }) {
    const role = await this.jobRoleService.createJobRole(body.name, body.description);
    return { role };
  }

  @Post('questions')
  async generateQuestions(@Body() dto: CreateQuestionDto) {
    const questions = await this.jobRoleService.generateQuestions(dto);
    return { questions };
  }

  @Post('question')
  async generateSingleQuestion(@Body() dto: CreateQuestionDto) {
    const result = await this.jobRoleService.generateSingleQuestion(dto);
    return result;
  }

  @Post('next-question')
  async getNextQuestion(@Body() dto: GetNextQuestionDto) {
    const result = await this.jobRoleService.getNextQuestion(
      dto.role,
      dto.difficulty,
      dto.numberOfQuestions
    );
    return result;
  }

  @Post('evaluate')
  async evaluateAnswer(@Body() dto: EvaluateAnswerDto) {
    const evaluation = await this.jobRoleService.evaluateAnswer(dto);
    return { evaluation };
  }
}
