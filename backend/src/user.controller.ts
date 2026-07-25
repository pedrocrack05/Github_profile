import { Controller, Get, Param } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubProfile } from './github.types';

@Controller('user')
export class UserController {
  constructor(private readonly githubService: GithubService) {}

  @Get(':username')
  getUser(@Param('username') username: string): Promise<GithubProfile> {
    return this.githubService.getUser(username);
  }
}
