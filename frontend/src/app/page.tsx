'use client';

import { Building2, CalendarDays, ExternalLink, Github, Link2, MapPin, Search, Users } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

type GithubProfile = {
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
};

const defaultUsername = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? 'pedrocrack05';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function Home() {
  const [profile, setProfile] = useState<GithubProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (username: string) => {
    const response = await fetch(`${apiBaseUrl}/user/${encodeURIComponent(username)}`);

    if (!response.ok) {
      throw new Error(response.status === 404 ? 'Usuario no encontrado' : 'No se pudo cargar el perfil desde el backend');
    }

    return (await response.json()) as GithubProfile;
  }, []);

  const loadDefaultProfile = useCallback(async (notice?: string) => {
    const defaultProfile = await fetchProfile(defaultUsername);
    setProfile(defaultProfile);
    setSearchTerm('');
    setMessage(notice ?? null);
  }, [fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialProfile() {
      try {
        setIsLoading(true);
        setError(null);
        const defaultProfile = await fetchProfile(defaultUsername);

        if (isMounted) {
          setProfile(defaultProfile);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error inesperado');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialProfile();

    return () => {
      isMounted = false;
    };
  }, [fetchProfile]);

  function handleSearchFocus() {
    const input = searchInputRef.current;

    if (!input) {
      return;
    }

    const cursorPosition = input.value.length;
    requestAnimationFrame(() => input.setSelectionRange(cursorPosition, cursorPosition));
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const requestedUsername = searchTerm.trim();

    if (!requestedUsername) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      const searchedProfile = await fetchProfile(requestedUsername);
      setProfile(searchedProfile);
      setSearchTerm(searchedProfile.username);
    } catch (err) {
      const notice = err instanceof Error ? err.message : 'Usuario no encontrado';
      try {
        await loadDefaultProfile(`${notice}. Se muestra nuevamente el perfil predeterminado.`);
      } catch (fallbackErr) {
        setError(fallbackErr instanceof Error ? fallbackErr.message : 'Error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading && !profile) {
    return (
      <main className="page-shell centered">
        <section className="status-panel">Cargando perfil de GitHub...</section>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="page-shell centered">
        <section className="status-panel error">{error ?? 'No hay datos para mostrar'}</section>
      </main>
    );
  }

  const isDefaultProfile = profile.username.toLowerCase() === defaultUsername.toLowerCase();
  const facts = [
    { label: 'Repositorios', value: profile.publicRepos },
    { label: 'Seguidores', value: profile.followers },
    { label: 'Siguiendo', value: profile.following },
    { label: 'Gists', value: profile.publicGists },
  ];

  return (
    <main className="page-shell">
      <section className="search-stage">
        <div className="stage-copy">
          <span className="surface-kicker"><Github size={18} /> Explorador GitHub</span>
          <h1>Consulta perfiles públicos</h1>
        </div>

        <form className="search-panel" onSubmit={handleSearch}>
          <div className="search-field">
            <Search size={20} />
            <input
              ref={searchInputRef}
              aria-label="Usuario de GitHub"
              onFocus={handleSearchFocus}
              disabled={isLoading}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar usuario de GitHub"
              type="text"
              value={searchTerm}
            />
          </div>
          <button disabled={isLoading} type="submit">
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </section>

      {message ? <section className="notice-panel">{message}</section> : null}

      <section className="profile-header">
        <div className="avatar-frame">
          <img className="avatar" src={profile.avatarUrl} alt={`Avatar de ${profile.username}`} />
        </div>

        <div className="identity">
          <div className="profile-status">{isDefaultProfile ? 'Perfil predeterminado' : 'Resultado de búsqueda'}</div>
          <h2>{profile.name ?? profile.username}</h2>
          <a className="username" href={profile.htmlUrl} target="_blank" rel="noreferrer">
            @{profile.username} <ExternalLink size={16} />
          </a>
          <p>{profile.bio ?? 'Este perfil no tiene bio pública.'}</p>
        </div>
      </section>

      <section className="stats-grid" aria-label="Estadísticas del perfil">
        {facts.map((fact, index) => (
          <article className={index === 0 ? 'stat-card stat-card-primary' : 'stat-card'} key={fact.label}>
            <span>{fact.label}</span>
            <strong>{fact.value.toLocaleString('es')}</strong>
          </article>
        ))}
      </section>

      <section className="details-grid" aria-label="Detalles públicos del perfil">
        <article className={profile.company ? 'detail-row' : 'detail-row detail-row-muted'}>
          <Building2 size={20} />
          <span>{profile.company ?? 'Compañía no publicada'}</span>
        </article>
        <article className={profile.location ? 'detail-row' : 'detail-row detail-row-muted'}>
          <MapPin size={20} />
          <span>{profile.location ?? 'Ubicación no publicada'}</span>
        </article>
        <article className={profile.blog ? 'detail-row' : 'detail-row detail-row-muted'}>
          <Link2 size={20} />
          {profile.blog ? (
            <a href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`} target="_blank" rel="noreferrer">
              {profile.blog}
            </a>
          ) : (
            <span>Sitio web no publicado</span>
          )}
        </article>
        <article className="detail-row">
          <Users size={20} />
          <span>{profile.followers.toLocaleString('es')} seguidores públicos</span>
        </article>
        <article className="detail-row">
          <CalendarDays size={20} />
          <span>Creado el {formatDate(profile.createdAt)}</span>
        </article>
        <article className="detail-row">
          <CalendarDays size={20} />
          <span>Actualizado el {formatDate(profile.updatedAt)}</span>
        </article>
      </section>
    </main>
  );
}
