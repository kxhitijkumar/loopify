import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { getBestImageUrl, formatMs, getLyrics } from '../api/saavn';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import PlaylistPickerModal from '../components/PlaylistPickerModal';

const { width } = Dimensions.get('window');

type PlayerNavProp = StackNavigationProp<RootStackParamList, 'Player'>;

export default function PlayerScreen() {
  const navigation = useNavigation<PlayerNavProp>();
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const lastFetchedId = useRef<string | null>(null);

  const {
    currentSong,
    queue,
    queueIndex,
    isPlaying,
    position,
    duration,
    isLoading,
    isQueueVisible,
    shuffleEnabled,
    repeatMode,
    setIsPlaying,
    requestSeek,
    playNext,
    playPrev,
    setQueueVisible,
    toggleShuffle,
    cycleRepeat,
    playFromQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    toggleLike,
    isSongLiked,
  } = useStore();

  // Fetch lyrics whenever the panel is opened or the song changes
  useEffect(() => {
    if (!currentSong || !showLyrics) return;
    if (lastFetchedId.current === currentSong.id) return;
    lastFetchedId.current = currentSong.id;
    setLyrics(null);
    setLyricsLoading(true);
    getLyrics(currentSong.id).then((text) => {
      setLyrics(text);
      setLyricsLoading(false);
    });
  }, [currentSong, showLyrics]);

  // Reset lyrics cache when song changes so re-opening refetches
  useEffect(() => {
    if (currentSong && lastFetchedId.current !== currentSong.id) {
      setLyrics(null);
    }
  }, [currentSong?.id]);

  if (!currentSong) return null;

  const liked = isSongLiked(currentSong.id);

  const imageUrl = getBestImageUrl(currentSong.image);
  const artistNames =
    currentSong.artists?.primary?.map((a) => a.name).join(', ') ?? '';

  const displayPosition = sliderValue !== null ? sliderValue : position;
  const progress = duration ? displayPosition / duration : 0;

  const artSize = width * 0.82;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#08080F" />

      {/* Ambient blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Tabs')}
            activeOpacity={0.7}
            style={styles.headerBtn}
          >
            <Ionicons name="chevron-down" size={24} color="#C084FC" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerSub}>NOW PLAYING</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentSong.name}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setQueueVisible(!isQueueVisible)}
            activeOpacity={0.7}
            style={styles.headerBtn}
          >
            <MaterialCommunityIcons name="playlist-music" size={24} color={isQueueVisible ? '#A855F7' : '#C084FC'} />
          </TouchableOpacity>
        </View>

        {/* Album Art */}
        <View style={styles.artWrapper}>
          <View style={[styles.artGlow, { width: artSize + 40, height: artSize + 40, borderRadius: (artSize + 40) / 2 }]} />
          <Image
            source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')}
            style={[styles.art, { width: artSize, height: artSize, borderRadius: 20 }]}
            resizeMode="cover"
          />
        </View>

        {/* Song Info + Like */}
        <View style={styles.infoRow}>
          <View style={styles.infoText}>
            <Text style={styles.songName} numberOfLines={1}>
              {currentSong.name}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {artistNames}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleLike(currentSong)}
            activeOpacity={0.7}
            style={styles.likeBtn}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={26}
              color={liked ? '#A855F7' : '#4B5563'}
            />
          </TouchableOpacity>
        </View>

        {/* Seekbar */}
        <View style={styles.seekContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={displayPosition}
            onValueChange={(val) => setSliderValue(val)}
            onSlidingComplete={async (val) => {
              requestSeek(val);
              setSliderValue(null);
            }}
            minimumTrackTintColor="#A855F7"
            maximumTrackTintColor="#1A1A2E"
            thumbTintColor="#C084FC"
          />
          <View style={styles.timeRow}>
            <Text style={styles.time}>{formatMs(displayPosition)}</Text>
            <Text style={styles.time}>{formatMs(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={toggleShuffle}
            activeOpacity={0.7}
            style={styles.sideBtn}
          >
            <Ionicons
              name="shuffle"
              size={24}
              color={shuffleEnabled ? '#A855F7' : '#6B7280'}
            />
            {shuffleEnabled && <View style={styles.activeDot} />}
          </TouchableOpacity>

          <TouchableOpacity onPress={playPrev} activeOpacity={0.7} style={styles.skipBtn}>
            <Ionicons name="play-skip-back" size={28} color="#E2E8F0" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsPlaying(!isPlaying)}
            activeOpacity={0.8}
            style={styles.playBtn}
          >
            <View style={styles.playBtnInner}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={30}
                  color="#FFFFFF"
                  style={isPlaying ? undefined : { marginLeft: 3 }}
                />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={playNext} activeOpacity={0.7} style={styles.skipBtn}>
            <Ionicons name="play-skip-forward" size={28} color="#E2E8F0" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={cycleRepeat}
            activeOpacity={0.7}
            style={styles.sideBtn}
          >
            <Ionicons
              name={repeatMode === 'one' ? 'repeat-outline' : 'repeat'}
              size={24}
              color={repeatMode !== 'off' ? '#A855F7' : '#6B7280'}
            />
            {repeatMode !== 'off' && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </View>

        {/* Extra actions row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => setShowPlaylistPicker(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#A855F7" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, showLyrics && styles.actionBtnActive]}
            activeOpacity={0.7}
            onPress={() => setShowLyrics((v) => !v)}
          >
            <MaterialCommunityIcons
              name="microphone-variant"
              size={20}
              color={showLyrics ? '#C084FC' : '#A855F7'}
            />
          </TouchableOpacity>
        </View>

        {/* Lyrics Panel */}
        {showLyrics && (
          <View style={styles.lyricsCard}>
            <View style={styles.lyricsTitleRow}>
              <MaterialCommunityIcons name="microphone-variant" size={16} color="#A855F7" />
              <Text style={styles.lyricsTitle}>Lyrics</Text>
            </View>
            <View style={styles.lyricsDivider} />
            {lyricsLoading ? (
              <ActivityIndicator color="#A855F7" style={{ marginVertical: 24 }} />
            ) : lyrics ? (
              <Text style={styles.lyricsText}>{lyrics}</Text>
            ) : (
              <Text style={styles.lyricsUnavailable}>Lyrics not available for this song.</Text>
            )}
          </View>
        )}

        </ScrollView>

        {/* Floating Queue Overlay */}
        {isQueueVisible && (
          <>
            {/* Backdrop */}
            <TouchableOpacity
              style={styles.queueBackdrop}
              activeOpacity={1}
              onPress={() => setQueueVisible(false)}
            />

            {/* Sheet */}
            <View style={styles.queueSheet}>
              {/* Handle */}
              <View style={styles.queueHandle} />

              {/* Header */}
              <View style={styles.queueHeader}>
                <View style={styles.queueTitleRow}>
                  <MaterialCommunityIcons name="playlist-music" size={20} color="#A855F7" />
                  <Text style={styles.queueTitle}>Queue</Text>
                  <View style={styles.queueBadge}>
                    <Text style={styles.queueBadgeText}>{queue.length}</Text>
                  </View>
                </View>
                <View style={styles.queueHeaderRight}>
                  <TouchableOpacity
                    onPress={clearQueue}
                    activeOpacity={0.7}
                    style={styles.queueClearBtn}
                  >
                    <Ionicons name="trash-outline" size={13} color="#EF4444" />
                    <Text style={styles.queueClearText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setQueueVisible(false)}
                    activeOpacity={0.7}
                    style={styles.queueCloseBtn}
                  >
                    <Ionicons name="close" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.queueDivider} />

              {/* List */}
              <FlatList
                data={queue}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                ListEmptyComponent={
                  <View style={styles.queueEmptyContainer}>
                    <MaterialCommunityIcons name="music-off" size={36} color="#2D2D40" />
                    <Text style={styles.queueEmpty}>Queue is empty</Text>
                  </View>
                }
                renderItem={({ item, index }) => {
                  const isCurrent = index === queueIndex;
                  return (
                    <TouchableOpacity
                      key={`${item.id}-${index}`}
                      style={[styles.queueItem, isCurrent && styles.queueCurrentItem]}
                      onPress={() => playFromQueue(index)}
                      activeOpacity={0.75}
                    >
                      {/* Index or now-playing indicator */}
                      <View style={[styles.queueIndexBox, isCurrent && styles.queueIndexBoxActive]}>
                        {isCurrent ? (
                          <Ionicons name="musical-note" size={14} color="#A855F7" />
                        ) : (
                          <Text style={styles.queueIndexText}>{index + 1}</Text>
                        )}
                      </View>

                      {/* Song info */}
                      <View style={styles.queueItemInfo}>
                        <Text
                          style={[styles.queueItemName, isCurrent && styles.queueCurrentText]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text style={styles.queueItemArtist} numberOfLines={1}>
                          {item.artists?.primary?.map((a) => a.name).join(', ')}
                        </Text>
                      </View>

                      {/* Actions */}
                      <View style={styles.queueItemActions}>
                        <TouchableOpacity
                          onPress={() => reorderQueue(index, index - 1)}
                          disabled={index === 0}
                          activeOpacity={0.7}
                          style={styles.queueArrowBtn}
                        >
                          <Ionicons name="chevron-up" size={16} color={index === 0 ? '#2D2D40' : '#6B7280'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => reorderQueue(index, index + 1)}
                          disabled={index === queue.length - 1}
                          activeOpacity={0.7}
                          style={styles.queueArrowBtn}
                        >
                          <Ionicons name="chevron-down" size={16} color={index === queue.length - 1 ? '#2D2D40' : '#6B7280'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removeFromQueue(index)}
                          activeOpacity={0.7}
                          style={styles.queueArrowBtn}
                        >
                          <Ionicons name="trash-outline" size={15} color="#EF444480" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </>
        )}
      </SafeAreaView>

      <PlaylistPickerModal
        visible={showPlaylistPicker}
        song={currentSong}
        onClose={() => setShowPlaylistPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08080F' },
  blob1: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#5B21B6',
    opacity: 0.22,
  },
  blob2: {
    position: 'absolute',
    bottom: 100,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4C1D95',
    opacity: 0.15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#13131F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F1F2E',
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  headerSub: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    maxWidth: width * 0.55,
  },
  artWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 28,
  },

  artGlow: {
    position: 'absolute',
    backgroundColor: '#7C3AED',
    opacity: 0.18,
  },
  art: {
    backgroundColor: '#1A1A2E',
    shadowColor: '#A855F7',
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    marginBottom: 6,
  },
  infoText: { flex: 1 },
  songName: {
    color: '#F9FAFB',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  artist: { color: '#9CA3AF', fontSize: 14, marginTop: 4, fontWeight: '500' },
  likeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekContainer: { paddingHorizontal: 20, marginTop: 8 },
  slider: { width: '100%', height: 40 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
    paddingHorizontal: 4,
  },
  time: { color: '#6B7280', fontSize: 12, fontWeight: '500' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  sideBtn: { width: 44, alignItems: 'center', gap: 3 },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A855F7',
  },
  skipBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A855F7',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  playBtnInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 20,
    paddingBottom: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F0F1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1A1A2E',
  },
  actionBtnActive: {
    backgroundColor: '#1A0F30',
    borderColor: '#7C3AED',
  },
  lyricsCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#0D0D1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A1F4A',
    padding: 18,
  },
  lyricsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  lyricsTitle: {
    color: '#C084FC',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  lyricsDivider: {
    height: 1,
    backgroundColor: '#1E1E35',
    marginBottom: 14,
  },
  lyricsText: {
    color: '#D1D5DB',
    fontSize: 15,
    lineHeight: 26,
    fontWeight: '400',
  },
  lyricsUnavailable: {
    color: '#4B5563',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  /* ── Floating Queue Sheet ── */
  queueBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  queueSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '68%',
    backgroundColor: '#0E0E1C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#2A1F4A',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 30,
    overflow: 'hidden',
  },
  queueHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2D2D45',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  queueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queueTitle: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  queueBadge: {
    backgroundColor: '#2A1F4A',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  queueBadgeText: { color: '#A855F7', fontSize: 11, fontWeight: '700' },
  queueHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  queueClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#1A0A0A',
    borderWidth: 1,
    borderColor: '#EF444430',
  },
  queueClearText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },
  queueCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueDivider: {
    height: 1,
    backgroundColor: '#1A1A2E',
    marginHorizontal: 0,
  },
  queueEmptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 10,
  },
  queueEmpty: {
    color: '#3D3D55',
    fontSize: 14,
    fontWeight: '600',
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginHorizontal: 8,
    marginTop: 4,
    borderRadius: 12,
  },
  queueCurrentItem: {
    backgroundColor: '#1A0F30',
    borderWidth: 1,
    borderColor: '#3B1F6A',
  },
  queueIndexBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#161625',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  queueIndexBoxActive: {
    backgroundColor: '#2A1050',
    borderWidth: 1,
    borderColor: '#A855F730',
  },
  queueIndexText: { color: '#4B5563', fontSize: 11, fontWeight: '700' },
  queueItemInfo: { flex: 1 },
  queueItemName: { color: '#D1D5DB', fontSize: 13, fontWeight: '600' },
  queueCurrentText: { color: '#C084FC', fontWeight: '700' },
  queueItemArtist: { color: '#4B5563', fontSize: 11, marginTop: 2 },
  queueItemActions: { flexDirection: 'row', alignItems: 'center' },
  queueArrowBtn: { padding: 6 },
});