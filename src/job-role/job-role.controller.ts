import { Controller, Post, Body } from '@nestjs/common';
import { JobRoleService } from './job-role.service';
import { CreateQuestionDto } from './dto/create-question.dto';

@Controller('job-role')
export class JobRoleController {
  constructor(private readonly jobRoleService: JobRoleService) {}

  @Post('questions')
  async generateQuestions(@Body() dto: CreateQuestionDto) {
    const questions = await this.jobRoleService.generateQuestions(dto);
    return { questions };
  }
}
