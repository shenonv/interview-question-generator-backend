import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobRoleModule } from './job-role/job-role.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JobRoleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
