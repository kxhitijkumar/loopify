import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import CustomDialog from '../components/CustomDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { getAlbumById, getBestImageUrl, formatMs, Album, Song } from '../api/saavn';
import { useStore } from '../store/useStore';
import PlaylistPickerModal from '../components/PlaylistPickerModal';

type Nav = StackNavigationProp<RootStackParamList>;
type AlbumRoute = RouteProp<RootStackParamList, 'Album'>;

const { width } = Dimensions.get('window');
const ART_SIZE = width * 0.55;

export default function AlbumScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<AlbumRoute>();
  const { albumId } = route.params;
  const { setCurrentSong, addToQueue, saveAlbum, unsaveAlbum, savedAlbums } = useStore();

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pickerSong, setPickerSong] = useState<Song | null>(null);

  const isSaved = album ? savedAlbums.some((a) => a.id === album.id) : false;

  useEffect(() => {
    loadAlbum();
  }, [albumId]);

  const loadAlbum = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getAlbumById(albumId);
      setAlbum(data);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
    navigation.navigate('Player');
  };

  const handlePlayAll = () => {
    if (!album?.songs?.length) return;
    album.songs.forEach((s) => addToQueue(s));
    setCurrentSong(album.songs[0]);
    navigation.navigate('Player');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#A855F7" size="large" />
      </View>
    );
  }

  if (error || !album) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#374151" />
        <Text style={styles.errorText}>Couldn't load album</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadAlbum}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUrl = getBestImageUrl(album.image);
  const artistName = album.artists?.primary?.map((a) => a.name).join(', ') || 'Unknown Artist';
  const songs = album.songs ?? [];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#08080F" />

      {/* Ambient blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* Back button */}
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color="#F3F4F6" />
              </TouchableOpacity>

              {/* Album art */}
              <View style={styles.artWrapper}>
                <Image
                  source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')}
                  style={styles.art}
                  resizeMode="cover"
                />
              </View>

              {/* Album info */}
              <View style={styles.infoBlock}>
                <Text style={styles.albumName} numberOfLines={2}>{album.name}</Text>
                <Text style={styles.artistName}>{artistName}</Text>
                {album.year ? (
                  <Text style={styles.meta}>
                    {album.year}
                    {album.language ? `  ·  ${String(album.language).toUpperCase()}` : ''}
                    {songs.length > 0 ? `  ·  ${songs.length} songs` : ''}
                  </Text>
                ) : null}
              </View>

              {/* Action row */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.playAllBtn}
                  onPress={handlePlayAll}
                  activeOpacity={0.85}
                  disabled={songs.length === 0}
                >
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text style={styles.playAllText}>Play All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shuffleBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!songs.length) return;
                    const shuffled = [...songs].sort(() => Math.random() - 0.5);
                    shuffled.forEach((s) => addToQueue(s));
                    setCurrentSong(shuffled[0]);
                    navigation.navigate('Player');
                  }}
                >
                  <Ionicons name="shuffle" size={20} color="#A855F7" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shuffleBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!album) return;
                    if (isSaved) {
                      unsaveAlbum(album.id);
                    } else {
                      saveAlbum(album);
                    }
                  }}
                >
                  <Ionicons
                    name={isSaved ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isSaved ? '#A855F7' : '#6B7280'}
                  />
                </TouchableOpacity>
              </View>

              {songs.length > 0 && (
                <Text style={styles.tracksLabel}>TRACKS</Text>
              )}

              {songs.length === 0 && !loading && (
                <View style={styles.emptyTracks}>
                  <Ionicons name="musical-notes-outline" size={40} color="#374151" />
                  <Text style={styles.emptyTrackText}>No tracks available</Text>
                </View>
              )}
            </>
          }
          renderItem={({ item, index }) => (
            <AlbumTrackItem
              song={item}
              index={index + 1}
              onPress={() => handlePlaySong(item)}
              onAddQueue={() => addToQueue(item)}
              onAddToPlaylist={() => setPickerSong(item)}
            />
          )}
        />
      </SafeAreaView>

      <PlaylistPickerModal
        visible={!!pickerSong}
        song={pickerSong}
        onClose={() => setPickerSong(null)}
      />
    </View>
  );
}

function AlbumTrackItem({
  song,
  index,
  onPress,
  onAddQueue,
  onAddToPlaylist,
}: {
  song: Song;
  index: number;
  onPress: () => void;
  onAddQueue: () => void;
  onAddToPlaylist: () => void;
}) {
  const toggleLike = useStore((s) => s.toggleLike);
  const isSongLiked = useStore((s) => s.isSongLiked);
  const liked = isSongLiked(song.id);
  const artist = song.artists?.primary?.map((a) => a.name).join(', ') || 'Unknown';
  const [showOptions, setShowOptions] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.trackItem} onPress={onPress} activeOpacity={0.75}>
        <Text style={styles.trackIndex}>{index}</Text>
        <View style={styles.trackInfo}>
          <Text style={styles.trackName} numberOfLines={1}>{song.name}</Text>
          <Text style={styles.trackArtist} numberOfLines={1}>{artist}</Text>
        </View>
        <Text style={styles.trackDuration}>{formatMs((song.duration ?? 0) * 1000)}</Text>
        <TouchableOpacity
          onPress={() => toggleLike(song)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.addBtn}
        >
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#A855F7' : '#4B5563'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowOptions(true)}
          style={styles.addBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={18} color="#4B5563" />
        </TouchableOpacity>
      </TouchableOpacity>

      <CustomDialog
        visible={showOptions}
        title={song.name}
        message={artist}
        actions={[
          { label: 'Play Now', icon: 'play-circle-outline', onPress },
          { label: 'Add to Queue', icon: 'add-circle-outline', onPress: onAddQueue },
          { label: 'Add to Playlist', icon: 'list-outline', onPress: onAddToPlaylist },
          {
            label: liked ? 'Unlike' : 'Like',
            icon: liked ? 'heart-dislike-outline' : 'heart-outline',
            onPress: () => toggleLike(song),
          },
          { label: 'Cancel', style: 'cancel' },
        ]}
        onDismiss={() => setShowOptions(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08080F' },
  centered: {
    flex: 1,
    backgroundColor: '#08080F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: { color: '#9CA3AF', fontSize: 16, fontWeight: '600' },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#A855F7',
    borderRadius: 20,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  blob1: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#5B21B6',
    opacity: 0.18,
  },
  blob2: {
    position: 'absolute',
    top: 300,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#2563EB',
    opacity: 0.1,
  },
  listContent: { paddingBottom: 120 },
  backBtn: {
    marginTop: 8,
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#13131F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F1F2E',
    marginBottom: 24,
  },
  artWrapper: {
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#A855F7',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  art: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
  },
  infoBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 6,
    marginBottom: 24,
  },
  albumName: {
    color: '#F9FAFB',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  artistName: {
    color: '#A855F7',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  meta: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  playAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#A855F7',
    paddingVertical: 13,
    borderRadius: 30,
  },
  playAllText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  shuffleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#13131F',
    borderWidth: 1,
    borderColor: '#1F1F2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tracksLabel: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  emptyTracks: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  emptyTrackText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0F0F1A',
    gap: 14,
  },
  trackIndex: {
    width: 24,
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  trackInfo: { flex: 1 },
  trackName: { color: '#F3F4F6', fontSize: 14, fontWeight: '600', marginBottom: 3 },
  trackArtist: { color: '#6B7280', fontSize: 12 },
  trackDuration: { color: '#4B5563', fontSize: 12 },
  addBtn: { padding: 4 },
});
