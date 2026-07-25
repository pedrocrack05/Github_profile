import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { GithubProfile, GithubUserApiResponse } from './github.types';

const DEFAULT_USERNAME = 'pedrocrack05';
const DEFAULT_PROFILE: GithubProfile = {
  username: 'pedrocrack05',
  name: 'Pedro Orrego',
  bio: 'Currently i am a systems engineering under graduate who is passionate about software design and creating innovative technological solutions.',
  avatarUrl: 'https://avatars.githubusercontent.com/u/140528686?v=4',
  htmlUrl: 'https://github.com/pedrocrack05',
  company: null,
  blog: '',
  location: 'Envigado, Colombia',
  email: null,
  publicRepos: 5,
  publicGists: 0,
  followers: 0,
  following: 0,
  createdAt: '2023-07-25T14:50:50Z',
  updatedAt: '2026-07-25T03:04:13Z',
};

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly cache = new Map<string, GithubProfile>();

  async getUser(username: string): Promise<GithubProfile> {
    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      throw new HttpException('Username is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const response = await fetch(`https://api.github.com/users/${encodeURIComponent(normalizedUsername)}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'github-profile-challenge',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (response.status === 404) {
        throw new HttpException('GitHub user not found', HttpStatus.NOT_FOUND);
      }

      if (!response.ok) {
        this.logger.warn(`GitHub API request failed with status ${response.status}`);
        return this.getFallbackProfile(normalizedUsername);
      }

      const user = (await response.json()) as GithubUserApiResponse;
      const profile = this.mapGithubUser(user);
      this.cache.set(profile.username.toLowerCase(), profile);

      return profile;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.warn('GitHub API request failed before receiving a valid response');
      return this.getFallbackProfile(normalizedUsername);
    }
  }

  private getFallbackProfile(username: string): GithubProfile {
    const cacheKey = username.toLowerCase();
    const cachedProfile = this.cache.get(cacheKey);

    if (cachedProfile) {
      return cachedProfile;
    }

    if (cacheKey === DEFAULT_USERNAME) {
      return DEFAULT_PROFILE;
    }

    throw new HttpException('GitHub API request failed', HttpStatus.BAD_GATEWAY);
  }

  private mapGithubUser(user: GithubUserApiResponse): GithubProfile {
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
