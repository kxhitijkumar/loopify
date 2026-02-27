import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import CustomDialog, { DialogAction } from '../components/CustomDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
//import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import { searchSongs, Song, getBestImageUrl, searchAlbums, Album } from '../api/saavn';
import { RootStackParamList } from '../../App';

type Nav = StackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;
const FEATURED_WIDTH = width - 32;

const MOODS = [
  { label: 'Chill', query: 'chill lofi', icon: 'palm-tree', color: '#7C3AED' },
  { label: 'Workout', query: 'workout gym', icon: 'run-fast', color: '#DC2626' },
  { label: 'Focus', query: 'focus study', icon: 'lightning-bolt', color: '#0891B2' },
  { label: 'Party', query: 'party dance', icon: 'music-note-eighth', color: '#D97706' },
  { label: 'Romance', query: 'romantic love', icon: 'heart-pulse', color: '#DB2777' },
  { label: 'Sleep', query: 'sleep calm', icon: 'sleep', color: '#4338CA' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning1 Welcome to';
  if (h < 17) return 'Good Afternoon! Welcome to';
  return 'Good Evening! Welcome to';
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const {
    setCurrentSong,
    setPendingMoodQuery,
    shuffleEnabled,
    repeatMode,
    toggleShuffle,
    cycleRepeat,
    clearQueue,
    queue,
    likedSongs,
    unlikeSong,
    playlists,
    deletePlaylist,
  } = useStore();

  const [showSettings, setShowSettings] = useState(false);
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    actions: DialogAction[];
  }>({ visible: false, title: '', actions: [] });

  const dismissDialog = () => setDialog((d) => ({ ...d, visible: false }));
  const showDialog = (title: string, message: string | undefined, actions: DialogAction[]) =>
    setDialog({ visible: true, title, message, actions });

  const [featured, setFeatured] = useState<Song[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [featuredAlbums, setFeaturedAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [trend, fresh, pop, albums] = await Promise.all([
        searchSongs('trending hindi', 1, 6),
        searchSongs('new releases 2024', 1, 10),
        searchSongs('top pop hits', 1, 10),
        searchAlbums('top hindi albums', 1, 10),
      ]);
      setFeatured(trend);
      setNewReleases(fresh);
      setRecentlyPlayed(pop);
      setFeaturedAlbums(albums);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (song: Song) => {
    setCurrentSong(song);
    navigation.navigate('Player');
  };

  const handleAlbumPress = (album: Album) => {
    navigation.navigate('Album', { albumId: album.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#A855F7" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#08080F" />

      {/* Ambient background */}
      <View style={styles.ambientBlob1} />
      <View style={styles.ambientBlob2} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.appName}>
                <Text style={{ color: '#F9FAFB' }}>L</Text>
                <Text style={{ color: '#A855F7' }}>oo</Text>
                <Text style={{ color: '#F9FAFB' }}>p</Text>
                <Text style={{ color: '#C084FC' }}>ify</Text>
              </Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => setShowSettings(true)}>
                <Ionicons name="settings-outline" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Featured Carousel */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured</Text>
          </View>
          <FlatList
            horizontal
            data={featured}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={FEATURED_WIDTH + 12}
            decelerationRate="fast"
            renderItem={({ item }) => (
              <FeaturedCard song={item} onPress={() => handlePlay(item)} />
            )}
          />

          {/* Mood Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by Mood</Text>
          </View>
          <MoodGrid
            onMoodPress={(query) => {
              setPendingMoodQuery(query);
              (navigation as any).navigate('Search');
            }}
          />

          {/* New Releases */}
          <SongRow
            title="New Releases"
            songs={newReleases}
            onPress={handlePlay}
          />

          {/* Top Hits */}
          <SongRow
            title="Top Hits"
            songs={recentlyPlayed}
            onPress={handlePlay}
          />

          {/* Featured Albums */}
          {featuredAlbums.length > 0 && (
            <AlbumRow albums={featuredAlbums} onPress={handleAlbumPress} />
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <TouchableOpacity
          style={styles.settingsBackdrop}
          activeOpacity={1}
          onPress={() => setShowSettings(false)}
        />
        <View style={styles.settingsSheet}>
          <View style={styles.settingsHandle} />

          <View style={styles.settingsHeader}>
            <Ionicons name="settings-outline" size={20} color="#A855F7" />
            <Text style={styles.settingsTitle}>Settings</Text>
            <TouchableOpacity
              onPress={() => setShowSettings(false)}
              activeOpacity={0.7}
              style={styles.settingsCloseBtn}
            >
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

            {/* ── Playback ── */}
            <Text style={styles.settingsSection}>Playback</Text>

            <View style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <Ionicons name="shuffle" size={20} color="#A855F7" />
                <View>
                  <Text style={styles.settingsRowLabel}>Shuffle</Text>
                  <Text style={styles.settingsRowSub}>Play songs in random order</Text>
                </View>
              </View>
              <Switch
                value={shuffleEnabled}
                onValueChange={() => toggleShuffle()}
                trackColor={{ false: '#1F1F2E', true: '#7C3AED' }}
                thumbColor={shuffleEnabled ? '#C084FC' : '#4B5563'}
              />
            </View>

            <TouchableOpacity
              style={styles.settingsRow}
              activeOpacity={0.75}
              onPress={() => cycleRepeat()}
            >
              <View style={styles.settingsRowLeft}>
                <Ionicons
                  name={repeatMode === 'one' ? 'repeat-outline' : 'repeat'}
                  size={20}
                  color="#A855F7"
                />
                <View>
                  <Text style={styles.settingsRowLabel}>Repeat Mode</Text>
                  <Text style={styles.settingsRowSub}>
                    {'Currently: '}
                    <Text style={{ color: '#A855F7', fontWeight: '700' }}>
                      {repeatMode === 'off' ? 'Off' : repeatMode === 'one' ? 'Repeat One' : 'Repeat All'}
                    </Text>
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#4B5563" />
            </TouchableOpacity>

            {/* ── Library ── */}
            <Text style={styles.settingsSection}>Library</Text>

            <TouchableOpacity
              style={styles.settingsRow}
              activeOpacity={0.75}
              onPress={() => {
                if (queue.length === 0) {
                  showDialog('Queue Empty', 'There are no songs in the queue.', [
                    { label: 'OK', style: 'cancel' },
                  ]);
                  return;
                }
                showDialog(
                  'Clear Queue',
                  `Remove all ${queue.length} song(s) from the queue?`,
                  [
                    { label: 'Cancel', style: 'cancel' },
                    { label: 'Clear', style: 'destructive', onPress: () => clearQueue() },
                  ]
                );
              }}
            >
              <View style={styles.settingsRowLeft}>
                <Ionicons name="list-outline" size={20} color="#EF4444" />
                <View>
                  <Text style={[styles.settingsRowLabel, { color: '#EF4444' }]}>Clear Queue</Text>
                  <Text style={styles.settingsRowSub}>{queue.length} song(s) in queue</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#4B5563" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsRow}
              activeOpacity={0.75}
              onPress={() => {
                if (likedSongs.length === 0) {
                  showDialog('No Liked Songs', 'You have no liked songs to clear.', [
                    { label: 'OK', style: 'cancel' },
                  ]);
                  return;
                }
                showDialog(
                  'Clear Liked Songs',
                  `Remove all ${likedSongs.length} liked song(s)?`,
                  [
                    { label: 'Cancel', style: 'cancel' },
                    {
                      label: 'Clear',
                      style: 'destructive',
                      onPress: () => { likedSongs.forEach((s) => unlikeSong(s.id)); },
                    },
                  ]
                );
              }}
            >
              <View style={styles.settingsRowLeft}>
                <Ionicons name="heart-dislike-outline" size={20} color="#EF4444" />
                <View>
                  <Text style={[styles.settingsRowLabel, { color: '#EF4444' }]}>Clear Liked Songs</Text>
                  <Text style={styles.settingsRowSub}>{likedSongs.length} liked song(s)</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#4B5563" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsRow}
              activeOpacity={0.75}
              onPress={() => {
                if (playlists.length === 0) {
                  showDialog('No Playlists', 'You have no playlists to delete.', [
                    { label: 'OK', style: 'cancel' },
                  ]);
                  return;
                }
                showDialog(
                  'Delete All Playlists',
                  `Delete all ${playlists.length} playlist(s)? This cannot be undone.`,
                  [
                    { label: 'Cancel', style: 'cancel' },
                    {
                      label: 'Delete All',
                      style: 'destructive',
                      onPress: () => { playlists.forEach((p) => deletePlaylist(p.id)); },
                    },
                  ]
                );
              }}
            >
              <View style={styles.settingsRowLeft}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <View>
                  <Text style={[styles.settingsRowLabel, { color: '#EF4444' }]}>Delete All Playlists</Text>
                  <Text style={styles.settingsRowSub}>{playlists.length} playlist(s)</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#4B5563" />
            </TouchableOpacity>

            {/* ── About ── */}
            <Text style={styles.settingsSection}>About</Text>

            <View style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <Ionicons name="musical-notes-outline" size={20} color="#A855F7" />
                <View>
                  <Text style={styles.settingsRowLabel}>Loopify</Text>
                  <Text style={styles.settingsRowSub}>Version 1.0.0</Text>
                </View>
              </View>
            </View>

          </ScrollView>
        </View>
      </Modal>

      <CustomDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        actions={dialog.actions}
        onDismiss={dismissDialog}
      />
    </View>
  );
}

// ─── Featured Card ────────────────────────────────────────────────────────────
function FeaturedCard({ song, onPress }: { song: Song; onPress: () => void }) {
  const imageUrl = getBestImageUrl(song.image);
  const artist = song.artists?.primary?.[0]?.name ?? '';

  return (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image
        source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')}
        style={styles.featuredImage}
        resizeMode="cover"
      />
      {/* Pure RN gradient simulation using nested Views */}
      <View style={styles.featuredOverlayTop} />
      <View style={styles.featuredOverlayBottom}>
        <Text style={styles.featuredArtist}>{artist}</Text>
        <Text style={styles.featuredTitle} numberOfLines={2}>{song.name}</Text>
        <View style={styles.playPill}>
          <Ionicons name="play" size={12} color="#fff" />
          <Text style={styles.playPillText}>Play Now</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Mood Grid ────────────────────────────────────────────────────────────────
function MoodGrid({ onMoodPress }: { onMoodPress: (query: string) => void }) {
  return (
    <View style={styles.moodGrid}>
      {MOODS.map((mood) => (
        <TouchableOpacity
          key={mood.label}
          style={[styles.moodCard, { borderColor: mood.color + '40' }]}
          onPress={() => onMoodPress(mood.query)}
          activeOpacity={0.75}
        >
          <View style={[styles.moodIconBg, { backgroundColor: mood.color + '22' }]}>
            <MaterialCommunityIcons name={mood.icon as any} size={28} color={mood.color} />
          </View>
          <Text style={styles.moodLabel}>{mood.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Horizontal Song Row ──────────────────────────────────────────────────────
function SongRow({
  title,
  songs,
  onPress,
}: {
  title: string;
  songs: Song[];
  onPress: (song: Song) => void;
}) {
  return (
    <View style={styles.songRowSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        data={songs}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
        renderItem={({ item }) => (
          <SongCard song={item} onPress={() => onPress(item)} />
        )}
      />
    </View>
  );
}

// ─── Song Card ────────────────────────────────────────────────────────────────
function SongCard({ song, onPress }: { song: Song; onPress: () => void }) {
  const imageUrl = getBestImageUrl(song.image);
  const artist = song.artists?.primary?.[0]?.name ?? '';

  return (
    <TouchableOpacity style={styles.songCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.songCardImageWrapper}>
        <Image
          source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')}
          style={styles.songCardImage}
          resizeMode="cover"
        />
        <View style={styles.songCardPlayBtn}>
          <Ionicons name="play" size={14} color="#fff" />
        </View>
      </View>
      <Text style={styles.songCardTitle} numberOfLines={1}>{song.name}</Text>
      <Text style={styles.songCardArtist} numberOfLines={1}>{artist}</Text>
    </TouchableOpacity>
  );
}

// ─── Album Row ────────────────────────────────────────────────────────────────
function AlbumRow({ albums, onPress }: { albums: Album[]; onPress: (album: Album) => void }) {
  return (
    <View style={styles.songRowSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Albums</Text>
      </View>
      <FlatList
        horizontal
        data={albums}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
        renderItem={({ item }) => (
          <AlbumCard album={item} onPress={() => onPress(item)} />
        )}
      />
    </View>
  );
}

// ─── Album Card ────────────────────────────────────────────────────────────────
function AlbumCard({ album, onPress }: { album: Album; onPress: () => void }) {
  const imageUrl = getBestImageUrl(album.image);
  const artist = album.artists?.primary?.[0]?.name ?? '';

  return (
    <TouchableOpacity style={styles.albumCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.albumCardImageWrapper}>
        <Image
          source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')}
          style={styles.albumCardImage}
          resizeMode="cover"
        />
        <View style={styles.albumCardBadge}>
          <Ionicons name="disc-outline" size={12} color="#A855F7" />
        </View>
      </View>
      <Text style={styles.albumCardTitle} numberOfLines={1}>{album.name}</Text>
      <Text style={styles.albumCardArtist} numberOfLines={1}>{artist}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08080F' },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#08080F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientBlob1: {
    position: 'absolute',
    top: -100,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#5B21B6',
    opacity: 0.18,
  },
  ambientBlob2: {
    position: 'absolute',
    top: 350,
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#2563EB',
    opacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  greeting: { color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 2,
    textShadowColor: '#A855F7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#13131F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F1F2E',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#F3F4F6',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAll: { color: '#A855F7', fontSize: 13, fontWeight: '600' },
  // Featured
  carouselContent: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  featuredCard: {
    width: FEATURED_WIDTH,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
  },
  featuredImage: { width: '100%', height: '100%' },
  featuredOverlayTop: {
  position: 'absolute',
  top: 0, left: 0, right: 0,
  height: '40%',
  backgroundColor: 'transparent',
},
featuredOverlayBottom: {
  position: 'absolute',
  bottom: 0, left: 0, right: 0,
  height: '65%',
  backgroundColor: 'rgba(8,8,15,0.88)',
  justifyContent: 'flex-end',
  padding: 16,
  gap: 4,
},
  featuredInfo: { gap: 4 },
  featuredArtist: { color: '#A855F7', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  featuredTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  playPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#A855F7',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 6,
  },
  playPillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  // Mood
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  moodCard: {
    width: (width - 42) / 2,
    height: (width - 42) / 2,
    borderRadius: 16,
    backgroundColor: '#0F0F1A',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  moodIconBg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: { color: '#E5E7EB', fontSize: 14, fontWeight: '700' },
  // Song Row
  songRowSection: { marginBottom: 8 },
  rowContent: { paddingHorizontal: 16, gap: 14 },
  songCard: { width: CARD_WIDTH },
  songCardImageWrapper: { position: 'relative', marginBottom: 8 },
  songCardImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 12,
    backgroundColor: '#1A1A2E',
  },
  songCardPlayBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#A855F7',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  songCardTitle: { color: '#F3F4F6', fontSize: 13, fontWeight: '700', letterSpacing: -0.1 },
  songCardArtist: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  // Album card
  albumCard: { width: CARD_WIDTH },
  albumCardImageWrapper: { position: 'relative', marginBottom: 8 },
  albumCardImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 12,
    backgroundColor: '#1A1A2E',
  },
  albumCardBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#13131F',
    borderWidth: 1,
    borderColor: '#A855F733',
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumCardTitle: { color: '#F3F4F6', fontSize: 13, fontWeight: '700', letterSpacing: -0.1 },
  albumCardArtist: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  // Settings Modal
  settingsBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  settingsSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
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
    maxHeight: '80%',
  },
  settingsHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2D2D45',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 10,
  },
  settingsTitle: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  settingsCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsSection: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 6,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#13131F',
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  settingsRowLabel: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsRowSub: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
});