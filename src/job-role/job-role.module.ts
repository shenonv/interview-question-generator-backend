import { Module, OnModuleInit } from '@nestjs/common';
import { JobRoleController } from './job-role.controller';
import { JobRoleService } from './job-role.service';
import { JobRoleSeeder } from './job-role.seeder';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user';
import { Question } from 'src/entities/question';
import { Answer } from 'src/entities/answer';
import { JobRole } from 'src/entities/job-role';

@Module({
  controllers: [JobRoleController],
  providers: [JobRoleService, JobRoleSeeder],
  imports: [TypeOrmModule.forFeature([User, Question, Answer, JobRole])]
})
export class JobRoleModule implements OnModuleInit {
  constructor(private readonly jobRoleSeeder: JobRoleSeeder) {}

  async onModuleInit() {
    // Seed job roles when the module initializes
    await this.jobRoleSeeder.seed();
  }
}
