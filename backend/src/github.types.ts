export interface GithubUserApiResponse {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GithubProfile {
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string;
  htmlUrl: string;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnghUserResponse {
  user?: {
    id: number;
    username: string;
    name: string | null;
    twitter?: string | null;
    avatar?: string;
  };
}

export interface UnghReposResponse {
  repos?: Array<{
    id: number;
    name: string;
    repo: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    pushedAt: string;
    stars: number;
    watchers: number;
    forks: number;
    defaultBranch: string;
  }>;
}
