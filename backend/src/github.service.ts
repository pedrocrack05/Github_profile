import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GithubProfile, GithubUserApiResponse } from './github.types';

@Injectable()
export class GithubService {
  async getUser(username: string): Promise<GithubProfile> {
    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      throw new HttpException('Username is required', HttpStatus.BAD_REQUEST);
    }

    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(normalizedUsername)}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'github-profile-challenge',
      },
    });

    if (response.status === 404) {
      throw new HttpException('GitHub user not found', HttpStatus.NOT_FOUND);
    }

    if (!response.ok) {
      throw new HttpException('GitHub API request failed', HttpStatus.BAD_GATEWAY);
    }

    const user = (await response.json()) as GithubUserApiResponse;

    return {
      username: user.login,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      htmlUrl: user.html_url,
      company: user.company,
      blog: user.blog,
      location: user.location,
      email: user.email,
      publicRepos: user.public_repos,
      publicGists: user.public_gists,
      followers: user.followers,
      following: user.following,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}
