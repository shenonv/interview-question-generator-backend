import { Controller, Post, Body, Get, Req } from '@nestjs/common';
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
  async generateQuestions(@Body() dto: CreateQuestionDto, @Req() req: any) {
    try {
      console.log(' Controller received DTO:', JSON.stringify(dto, null, 2));
      console.log(' Role from DTO:', dto.role);
      console.log(' DTO type:', typeof dto.role);
      console.log(' DTO keys:', Object.keys(dto));
      console.log(' Raw request body:', JSON.stringify(dto, null, 2));
      console.log(' Is dto empty?', Object.keys(dto).length === 0);
      console.log(' Raw request body from req:', req.body);
      console.log(' Request headers:', req.headers);
      console.log(' Content-Type:', req.headers['content-type']);
      
      const questions = await this.jobRoleService.generateQuestions(dto);
      console.log('Controller returning questions:', questions.length);
      return { questions };
    } catch (error) {
      console.error('Error in generateQuestions controller:', error);
      return { 
        questions: [], 
        error: error.message || 'Failed to generate questions' 
      };
    }
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
