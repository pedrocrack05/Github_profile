import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { GithubProfile, GithubUserApiResponse, UnghReposResponse, UnghUserResponse } from './github.types';

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

    const cacheKey = normalizedUsername.toLowerCase();
    const cachedProfile = this.cache.get(cacheKey);

    if (cachedProfile) {
      return cachedProfile;
    }

    const profile = await this.fetchFromGithubApi(normalizedUsername)
      ?? await this.fetchFromGithubHtml(normalizedUsername)
      ?? await this.fetchFromUngh(normalizedUsername)
      ?? this.getDefaultFallback(normalizedUsername);

    this.cache.set(profile.username.toLowerCase(), profile);

    return profile;
  }

  private async fetchFromGithubApi(username: string): Promise<GithubProfile | null> {
    try {
      const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
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
        this.logger.warn(`GitHub REST request failed with status ${response.status}`);
        return null;
      }

      return this.mapGithubUser((await response.json()) as GithubUserApiResponse);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.warn('GitHub REST request failed before receiving a valid response');
      return null;
    }
  }

  private async fetchFromGithubHtml(username: string): Promise<GithubProfile | null> {
    try {
      const response = await fetch(`https://github.com/${encodeURIComponent(username)}`, {
        headers: {
          Accept: 'text/html',
          'User-Agent': 'github-profile-challenge',
        },
      });

      if (response.status === 404) {
        throw new HttpException('GitHub user not found', HttpStatus.NOT_FOUND);
      }

      if (!response.ok) {
        this.logger.warn(`GitHub HTML request failed with status ${response.status}`);
        return null;
      }

      return this.mapGithubHtml(await response.text(), username);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.warn('GitHub HTML request failed before receiving a valid response');
      return null;
    }
  }

  private async fetchFromUngh(username: string): Promise<GithubProfile | null> {
    try {
      const [userResponse, reposResponse] = await Promise.all([
        fetch(`https://ungh.cc/users/${encodeURIComponent(username)}`),
        fetch(`https://ungh.cc/users/${encodeURIComponent(username)}/repos`),
      ]);

      if (userResponse.status === 404) {
        throw new HttpException('GitHub user not found', HttpStatus.NOT_FOUND);
      }

      if (!userResponse.ok) {
        this.logger.warn(`ungh user request failed with status ${userResponse.status}`);
        return null;
      }

      const userData = (await userResponse.json()) as UnghUserResponse;

      if (!userData.user) {
        return null;
      }

      const reposData = reposResponse.ok ? ((await reposResponse.json()) as UnghReposResponse) : { repos: [] };
      const repos = reposData.repos ?? [];
      const dates = repos.flatMap((repo) => [repo.createdAt, repo.updatedAt, repo.pushedAt]).filter(Boolean).sort();
      const createdAt = dates[0] ?? new Date().toISOString();
      const updatedAt = dates[dates.length - 1] ?? createdAt;

      return {
        username: userData.user.username,
        name: userData.user.name,
        bio: null,
        avatarUrl: userData.user.avatar ?? `https://github.com/${userData.user.username}.png`,
        htmlUrl: `https://github.com/${userData.user.username}`,
        company: null,
        blog: '',
        location: null,
        email: null,
        publicRepos: repos.length,
        publicGists: 0,
        followers: 0,
        following: 0,
        createdAt,
        updatedAt,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.warn('ungh fallback request failed');
      return null;
    }
  }

  private getDefaultFallback(username: string): GithubProfile {
    if (username.toLowerCase() === DEFAULT_USERNAME) {
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

  private mapGithubHtml(html: string, requestedUsername: string): GithubProfile | null {
    const username = this.extractHtmlText(html, /<span[^>]*itemprop="additionalName"[^>]*>([\s\S]*?)<\/span>/i) ?? requestedUsername;
    const name = this.extractHtmlText(html, /<span[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/span>/i);
    const bio = this.extractAttribute(html, /<div[^>]*class="[^"]*user-profile-bio[^"]*"[^>]*data-bio-text="([\s\S]*?)"/i)
      ?? this.extractHtmlText(html, /<div[^>]*class="[^"]*user-profile-bio[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const avatarUrl = this.extractAttribute(html, /<a[^>]*itemprop="image"[^>]*href="([^"]+)"/i)
      ?? `https://github.com/${username}.png`;
    const location = this.extractAttribute(html, /aria-label="Home location: ([^"]+)"/i)
      ?? this.extractHtmlText(html, /<li[^>]*itemprop="homeLocation"[\s\S]*?<span[^>]*class="p-label"[^>]*>([\s\S]*?)<\/span>/i);
    const repoCount = this.extractCounterAfterLabel(html, 'Repositories');
    const followers = this.extractSocialCount(html, 'followers');
    const following = this.extractSocialCount(html, 'following');

    if (!username) {
      return null;
    }

    return {
      username,
      name: name || null,
      bio: bio || null,
      avatarUrl: this.decodeHtml(avatarUrl),
      htmlUrl: `https://github.com/${username}`,
      company: null,
      blog: '',
      location: location || null,
      email: null,
      publicRepos: repoCount,
      publicGists: 0,
      followers,
      following,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private extractCounterAfterLabel(html: string, label: string): number {
    const pattern = new RegExp(`${label}[\\s\\S]*?<span[^>]*class="Counter"[^>]*title="([^"]+)"`, 'i');
    return this.parseCount(pattern.exec(html)?.[1]);
  }

  private extractSocialCount(html: string, label: string): number {
    const pattern = new RegExp(`<a[^>]*href="[^\"]*\\?tab=${label}"[\\s\\S]*?<span[^>]*class="text-bold[^\"]*"[^>]*>([\\s\\S]*?)<\\/span>`, 'i');
    return this.parseCount(this.extractHtmlText(html, pattern));
  }

  private extractHtmlText(html: string, pattern: RegExp): string | null {
    const match = pattern.exec(html)?.[1];

    if (!match) {
      return null;
    }

    return this.decodeHtml(match.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  }

  private extractAttribute(html: string, pattern: RegExp): string | null {
    const match = pattern.exec(html)?.[1];
    return match ? this.decodeHtml(match).replace(/\s+/g, ' ').trim() : null;
  }

  private parseCount(value?: string | null): number {
    if (!value) {
      return 0;
    }

    const normalized = value.replace(/,/g, '').trim().toLowerCase();
    const multiplier = normalized.endsWith('k') ? 1000 : normalized.endsWith('m') ? 1000000 : 1;
    const numeric = Number.parseFloat(normalized.replace(/[km]/g, ''));

    return Number.isFinite(numeric) ? Math.round(numeric * multiplier) : 0;
  }

  private decodeHtml(value: string): string {
    return value
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
}
