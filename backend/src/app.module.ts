import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { GithubService } from './github.service';

@Module({
  controllers: [UserController],
  providers: [GithubService],
})
export class AppModule {}
