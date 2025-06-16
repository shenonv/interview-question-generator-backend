import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobRoleModule } from './job-role/job-role.module';

@Module({
  imports: [JobRoleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
