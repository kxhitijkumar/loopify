import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song, Album } from '../api/saavn';

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: number;
}

interface PlayerState {
  // Now playing
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  isLoading: boolean;
  seekRequest: number | null;

  // Queue
  queue: Song[];
  queueIndex: number;

  // Search
  searchQuery: string;
  searchResults: Song[];
  searchPage: number;
  isSearching: boolean;
  hasMore: boolean;

  // UI
  isQueueVisible: boolean;
  shuffleEnabled: boolean;
  repeatMode: 'off' | 'one' | 'all';

  // Mood navigation
  pendingMoodQuery: string | null;
  setPendingMoodQuery: (q: string | null) => void;

  // Saved Albums
  savedAlbums: Album[];
  saveAlbum: (album: Album) => void;
  unsaveAlbum: (albumId: string) => void;
  isAlbumSaved: (albumId: string) => boolean;

  // Liked Songs
  likedSongs: Song[];
  likeSong: (song: Song) => void;
  unlikeSong: (songId: string) => void;
  toggleLike: (song: Song) => void;
  isSongLiked: (songId: string) => boolean;

  // Playlists
  playlists: Playlist[];
  createPlaylist: (name: string) => string;
  deletePlaylist: (playlistId: string) => void;
  renamePlaylist: (playlistId: string, name: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;

  // Actions
  setCurrentSong: (song: Song) => void;
  setIsPlaying: (v: boolean) => void;
  setPosition: (ms: number) => void;
  setDuration: (ms: number) => void;
  setIsLoading: (v: boolean) => void;
  requestSeek: (ms: number) => void;
  clearSeekRequest: () => void;

  addToQueue: (song: Song) => void;
  addToQueueNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  playFromQueue: (index: number) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrev: () => void;

  setSearchQuery: (q: string) => void;
  setSearchResults: (results: Song[], page: number, hasMore: boolean) => void;
  appendSearchResults: (results: Song[], page: number, hasMore: boolean) => void;
  setIsSearching: (v: boolean) => void;

  setQueueVisible: (v: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

export const useStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentSong: null,
      isPlaying: false,
      position: 0,
      duration: 0,
      isLoading: false,
      seekRequest: null,

      queue: [],
      queueIndex: 0,

      searchQuery: '',
      searchResults: [],
      searchPage: 1,
      isSearching: false,
      hasMore: true,

      isQueueVisible: false,
      shuffleEnabled: false,
      repeatMode: 'off',

      pendingMoodQuery: null,
      setPendingMoodQuery: (q) => set({ pendingMoodQuery: q }),

      savedAlbums: [],
      saveAlbum: (album) =>
        set((s) => {
          if (s.savedAlbums.find((a) => a.id === album.id)) return s;
          return { savedAlbums: [album, ...s.savedAlbums] };
        }),
      unsaveAlbum: (albumId) =>
        set((s) => ({ savedAlbums: s.savedAlbums.filter((a) => a.id !== albumId) })),
      isAlbumSaved: (albumId) => !!get().savedAlbums.find((a) => a.id === albumId),

      likedSongs: [],
      likeSong: (song) =>
        set((s) => {
          if (s.likedSongs.find((l) => l.id === song.id)) return s;
          return { likedSongs: [song, ...s.likedSongs] };
        }),
      unlikeSong: (songId) =>
        set((s) => ({ likedSongs: s.likedSongs.filter((l) => l.id !== songId) })),
      toggleLike: (song) => {
        const liked = !!get().likedSongs.find((l) => l.id === song.id);
        if (liked) {
          set((s) => ({ likedSongs: s.likedSongs.filter((l) => l.id !== song.id) }));
        } else {
          set((s) => {
            if (s.likedSongs.find((l) => l.id === song.id)) return s;
            return { likedSongs: [song, ...s.likedSongs] };
          });
        }
      },
      isSongLiked: (songId) => !!get().likedSongs.find((l) => l.id === songId),

      playlists: [],
      createPlaylist: (name) => {
        const id = `pl_${Date.now()}`;
        set((s) => ({
          playlists: [
            { id, name, songs: [], createdAt: Date.now() },
            ...s.playlists,
          ],
        }));
        return id;
      },
      deletePlaylist: (playlistId) =>
        set((s) => ({ playlists: s.playlists.filter((p) => p.id !== playlistId) })),
      renamePlaylist: (playlistId, name) =>
        set((s) => ({
          playlists: s.playlists.map((p) => (p.id === playlistId ? { ...p, name } : p)),
        })),
      addSongToPlaylist: (playlistId, song) =>
        set((s) => ({
          playlists: s.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            if (p.songs.find((s) => s.id === song.id)) return p;
            return { ...p, songs: [...p.songs, song] };
          }),
        })),
      removeSongFromPlaylist: (playlistId, songId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id !== playlistId
              ? p
              : { ...p, songs: p.songs.filter((s) => s.id !== songId) }
          ),
        })),

      setCurrentSong: (song) =>
        set((state) => {
          if (state.currentSong?.id === song.id) return state;
          // Keep queue in sync so playNext/playPrev always work
          const existingIdx = state.queue.findIndex((s) => s.id === song.id);
          if (existingIdx >= 0) {
            return { currentSong: song, position: 0, queueIndex: existingIdx };
          }
          const newQueue = [...state.queue, song];
          return { currentSong: song, position: 0, queue: newQueue, queueIndex: newQueue.length - 1 };
        }),
      setIsPlaying: (v) => set({ isPlaying: v }),
      setPosition: (ms) => set({ position: ms }),
      setDuration: (ms) => set({ duration: ms }),
      setIsLoading: (v) => set({ isLoading: v }),
      requestSeek: (ms) => set({ seekRequest: ms }),
      clearSeekRequest: () => set({ seekRequest: null }),

      addToQueue: (song) => {
        set((state) => ({ queue: [...state.queue, song] }));
      },

      addToQueueNext: (song) => {
        const { queue, queueIndex } = get();
        const newQueue = [...queue];
        newQueue.splice(queueIndex + 1, 0, song);
        set({ queue: newQueue });
      },

      removeFromQueue: (index) => {
        const q = [...get().queue];
        q.splice(index, 1);
        let idx = get().queueIndex;
        if (index < idx) idx--;
        if (idx >= q.length) idx = Math.max(0, q.length - 1);
        set({ queue: q, queueIndex: idx });
      },

      reorderQueue: (from, to) => {
        const q = [...get().queue];
        const [removed] = q.splice(from, 1);
        q.splice(to, 0, removed);
        let idx = get().queueIndex;
        if (idx === from) idx = to;
        else if (from < idx && to >= idx) idx--;
        else if (from > idx && to <= idx) idx++;
        set({ queue: q, queueIndex: idx });
      },

      playFromQueue: (index) => {
        const { queue, queueIndex, currentSong } = get();
        if (index < 0 || index >= queue.length) return;
        const targetSong = queue[index];
        if (index === queueIndex && currentSong?.id === targetSong.id) return;
        set({ queueIndex: index, currentSong: queue[index], position: 0 });
      },

      clearQueue: () => set({ queue: [], queueIndex: 0, currentSong: null, isPlaying: false }),

      playNext: () => {
        const { queue, queueIndex, shuffleEnabled } = get();
        if (queue.length === 0) return;
        let nextIndex: number;
        if (shuffleEnabled) {
          nextIndex = Math.floor(Math.random() * queue.length);
        } else {
          nextIndex = (queueIndex + 1) % queue.length;
        }
        set({ queueIndex: nextIndex, currentSong: queue[nextIndex], position: 0 });
      },

      playPrev: () => {
        const { queue, queueIndex } = get();
        if (queue.length === 0) return;
        const prevIndex = (queueIndex - 1 + queue.length) % queue.length;
        set({ queueIndex: prevIndex, currentSong: queue[prevIndex], position: 0 });
      },

      setSearchQuery: (q) => set({ searchQuery: q }),

      setSearchResults: (results, page, hasMore) =>
        set({ searchResults: results, searchPage: page, hasMore }),

      appendSearchResults: (results, page, hasMore) =>
        set((state) => ({
          searchResults: [...state.searchResults, ...results],
          searchPage: page,
          hasMore,
        })),

      setIsSearching: (v) => set({ isSearching: v }),

      setQueueVisible: (v) => set({ isQueueVisible: v }),
      toggleShuffle: () => set((s) => ({ shuffleEnabled: !s.shuffleEnabled })),
      cycleRepeat: () =>
        set((s) => ({
          repeatMode:
            s.repeatMode === 'off' ? 'one' : s.repeatMode === 'one' ? 'all' : 'off',
        })),
    }),
    {
      name: 'music-player-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentSong: state.currentSong,
        queue: state.queue,
        queueIndex: state.queueIndex,
        shuffleEnabled: state.shuffleEnabled,
        repeatMode: state.repeatMode,
        savedAlbums: state.savedAlbums,
        likedSongs: state.likedSongs,
        playlists: state.playlists,
      }),
    }
  )
);