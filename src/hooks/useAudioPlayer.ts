import { useEffect, useRef, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useStore } from '../store/useStore';
import { getBestAudioUrl, getSongById } from '../api/saavn';

export function useAudioPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const {
    currentSong,
    isPlaying,
    repeatMode,
    seekRequest,
    setPosition,
    setDuration,
    setIsPlaying,
    setIsLoading,
    clearSeekRequest,
    setCurrentSong,
    playNext,
  } = useStore();

  // Configure audio session once on mount
  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Load and play when currentSong changes
  useEffect(() => {
    if (!currentSong) return;
    loadAndPlay();
  }, [currentSong?.id]);

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      setPosition(status.positionMillis);
      if (status.durationMillis) setDuration(status.durationMillis);
      if (status.didJustFinish) {
        if (useStore.getState().repeatMode === 'one') return;
        playNext();
      }
    },
    [playNext]
  );

  const loadAndPlay = async () => {
    if (!currentSong) return;
    try {
      setIsLoading(true);

      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Check if we already have a valid download URL
      let song = currentSong;
      const existingUrl = getBestAudioUrl(song.downloadUrl ?? []);

      if (!existingUrl) {
        // Fetch full song details from API
        console.log('Fetching full song details for:', song.id);
        const fullSong = await getSongById(song.id);
        if (!fullSong) throw new Error('Song not found');
        // Update the store with full details so image etc. also updates
        setCurrentSong(fullSong);
        song = fullSong;
      }

      const url = getBestAudioUrl(song.downloadUrl ?? []);
      if (!url) throw new Error('No audio URL available after fetching details');

      console.log('Loading audio from:', url);

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        {
          shouldPlay: true,
          progressUpdateIntervalMillis: 1000,
          isLooping: useStore.getState().repeatMode === 'one',
        },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch (err) {
      console.error('Audio load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Respond to play/pause changes from store
  useEffect(() => {
    if (!soundRef.current) return;
    if (isPlaying) {
      soundRef.current.playAsync();
    } else {
      soundRef.current.pauseAsync();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!soundRef.current) return;
    soundRef.current
      .setIsLoopingAsync(repeatMode === 'one')
      .catch(console.error);
  }, [repeatMode]);

  useEffect(() => {
    if (seekRequest === null) return;
    const runSeek = async () => {
      if (!soundRef.current) {
        clearSeekRequest();
        return;
      }
      await soundRef.current.setPositionAsync(seekRequest).catch(console.error);
      setPosition(seekRequest);
      clearSeekRequest();
    };
    runSeek();
  }, [seekRequest, clearSeekRequest, setPosition]);

  const seekTo = async (ms: number) => {
    await soundRef.current?.setPositionAsync(ms);
    setPosition(ms);
  };

  return { seekTo };
}