const BASE_URL = 'https://saavn.sumit.co';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Song {
  id: string;
  name: string;
  duration: number;
  language: string;
  album: { id: string; name: string };
  artists: { primary: { id: string; name: string }[] };
  image: { quality: string; url: string }[];
  downloadUrl: { quality: string; url: string }[];
}

export interface SearchResult {
  id: string;
  name: string;
  duration: string;
  album: { id: string; name: string; url: string };
  primaryArtists: string;
  image: { quality: string; link: string }[];
  downloadUrl: { quality: string; link: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getBestAudioUrl(
  downloadUrls: { quality: string; url?: string; link?: string }[]
): string {
  const priority = ['320kbps', '160kbps', '96kbps', '48kbps'];
  for (const q of priority) {
    const match = downloadUrls.find((d) => d.quality === q);
    if (match) return match.url ?? match.link ?? '';
  }
  return (
    downloadUrls[downloadUrls.length - 1]?.url ??
    downloadUrls[downloadUrls.length - 1]?.link ??
    ''
  );
}

export function getBestImageUrl(
  images: { quality: string; url?: string; link?: string }[]
): string {
  const priority = ['500x500', '150x150', '50x50'];
  for (const q of priority) {
    const match = images.find((i) => i.quality === q);
    if (match) return match.url ?? match.link ?? '';
  }
  return '';
}

export function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// Convert SearchResult → Song shape so the app uses one type everywhere
export function normalizeSearchResult(r: SearchResult): Song {
  // Log raw image data to debug
  console.log('Raw image data:', JSON.stringify((r as any)?.image?.[0]));
  console.log('Raw downloadUrl data:', JSON.stringify((r as any)?.downloadUrl?.[0]));

  return {
    id: r.id,
    name: r.name,
    duration: Number(r.duration),
    language: '',
    album: { id: r.album?.id ?? '', name: r.album?.name ?? '' },
    artists: {
      primary: Array.isArray((r as any).artists?.primary)
        ? (r as any).artists.primary.map((a: any) => ({ id: a.id ?? '', name: a.name ?? '' }))
        : (r.primaryArtists ?? '')
            .split(', ')
            .filter(Boolean)
            .map((n, i) => ({ id: String(i), name: n })),
    },
    // Handle both 'link' and 'url' field names
    image: (r.image ?? []).map((img: any) => ({
      quality: img.quality,
      url: img.url ?? img.link ?? '',
    })),
    downloadUrl: (r.downloadUrl ?? []).map((d: any) => ({
      quality: d.quality,
      url: d.url ?? d.link ?? '',
    })),
  };
}

// ─── Album types ─────────────────────────────────────────────────────────────

export interface Album {
  id: string;
  name: string;
  description?: string;
  year?: string | number;
  language?: string;
  artists: { primary: { id: string; name: string }[] };
  image: { quality: string; url: string }[];
  songs?: Song[];
  songCount?: number;
}

export function normalizeAlbum(raw: any): Album {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    description: raw.description ?? '',
    year: raw.year ?? '',
    language: raw.language ?? '',
    artists: {
      primary: Array.isArray(raw.artists?.primary)
        ? raw.artists.primary.map((a: any) => ({ id: a.id ?? '', name: a.name ?? '' }))
        : (raw.primaryArtists ?? '')
            .split(', ')
            .filter(Boolean)
            .map((n: string, i: number) => ({ id: String(i), name: n })),
    },
    image: (raw.image ?? []).map((img: any) => ({
      quality: img.quality,
      url: img.url ?? img.link ?? '',
    })),
    songs: Array.isArray(raw.songs)
      ? raw.songs
          .filter((s: any) => s && s.id && s.name)
          .map((s: any) => normalizeSearchResult(s))
      : undefined,
    songCount: raw.songCount ?? raw.songs?.length ?? 0,
  };
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function searchSongs(
  query: string,
  page = 1,
  limit = 20
): Promise<Song[]> {
  const res = await fetch(
    `${BASE_URL}/api/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  );
  const json = await res.json();
  
  // Log one result to see actual shape
  console.log('First search result raw:', JSON.stringify(json?.data?.results?.[0], null, 2));
  
  const results: SearchResult[] = json?.data?.results ?? [];
  return results
    .filter((item) => item && item.id && item.name)
    .map(normalizeSearchResult);
}

export async function getSongById(id: string): Promise<Song> {
  const res = await fetch(`${BASE_URL}/api/songs/${id}`);
  const json = await res.json();
  return json?.data?.[0] ?? null;
}

export async function getSongSuggestions(id: string): Promise<Song[]> {
  const res = await fetch(`${BASE_URL}/api/songs/${id}/suggestions`);
  const json = await res.json();
  return json?.data ?? [];
}

export async function searchAlbums(
  query: string,
  page = 1,
  limit = 20
): Promise<Album[]> {
  const res = await fetch(
    `${BASE_URL}/api/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  );
  const json = await res.json();
  const results: any[] = json?.data?.results ?? [];
  return results.filter((item) => item && item.id && item.name).map(normalizeAlbum);
}

export async function getAlbumById(id: string): Promise<Album | null> {
  const res = await fetch(`${BASE_URL}/api/albums?id=${id}`);
  const json = await res.json();
  const raw = json?.data;
  if (!raw) return null;
  return normalizeAlbum(raw);
}

export async function getLyrics(id: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/songs/${id}/lyrics`);
    const json = await res.json();
    const raw: string | undefined = json?.data?.lyrics;
    if (!raw) return null;
    // Strip HTML tags returned by the API
    return raw.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
  } catch {
    return null;
  }
}