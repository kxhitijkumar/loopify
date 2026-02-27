import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import CustomDialog from '../components/CustomDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Song, formatMs, getBestImageUrl } from '../api/saavn';
import { useStore } from '../store/useStore';
import { Image } from 'react-native';
import PlaylistPickerModal from '../components/PlaylistPickerModal';

type Nav = StackNavigationProp<RootStackParamList>;
type PlaylistRoute = RouteProp<RootStackParamList, 'Playlist'>;

const { width } = Dimensions.get('window');
const ART_SIZE = width * 0.5;

export default function PlaylistScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<PlaylistRoute>();
  const { playlistId } = route.params;
  const [pickerSong, setPickerSong] = useState<Song | null>(null);

  const { playlists, setCurrentSong, addToQueue, removeSongFromPlaylist } = useStore();
  const playlist = playlists.find((p) => p.id === playlistId);

  if (!playlist) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#374151" />
        <Text style={styles.errorText}>Playlist not found</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const songs = playlist.songs;

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
    navigation.navigate('Player');
  };

  const handlePlayAll = () => {
    if (!songs.length) return;
    songs.forEach((s) => addToQueue(s));
    setCurrentSong(songs[0]);
    navigation.navigate('Player');
  };

  const handleShuffleAll = () => {
    if (!songs.length) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    shuffled.forEach((s) => addToQueue(s));
    setCurrentSong(shuffled[0]);
    navigation.navigate('Player');
  };

  const handleRemoveSong = (songId: string, songName: string) => {
    removeSongFromPlaylist(playlistId, songId);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#08080F" />

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

              {/* Playlist artwork (generated) */}
              <View style={styles.artWrapper}>
                <View style={[styles.art, styles.artPlaceholder]}>
                  <MaterialCommunityIcons name="playlist-music" size={ART_SIZE * 0.45} color="#A855F7" />
                </View>
              </View>

              {/* Playlist info */}
              <View style={styles.infoBlock}>
                <Text style={styles.playlistName} numberOfLines={2}>{playlist.name}</Text>
                <Text style={styles.meta}>
                  {songs.length} song{songs.length !== 1 ? 's' : ''}
                </Text>
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
                  onPress={handleShuffleAll}
                  disabled={songs.length === 0}
                >
                  <Ionicons name="shuffle" size={20} color="#A855F7" />
                </TouchableOpacity>
              </View>

              {songs.length > 0 && (
                <Text style={styles.tracksLabel}>TRACKS</Text>
              )}

              {songs.length === 0 && (
                <View style={styles.emptyTracks}>
                  <Ionicons name="musical-notes-outline" size={40} color="#374151" />
                  <Text style={styles.emptyTrackText}>No songs yet</Text>
                  <Text style={styles.emptyTrackSub}>Add songs from search results</Text>
                </View>
              )}
            </>
          }
          renderItem={({ item, index }) => (
            <PlaylistTrackItem
              song={item}
              index={index + 1}
              onPress={() => handlePlaySong(item)}
              onAddQueue={() => addToQueue(item)}
              onRemove={() => handleRemoveSong(item.id, item.name)}
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

function PlaylistTrackItem({
  song,
  index,
  onPress,
  onAddQueue,
  onRemove,
  onAddToPlaylist,
}: {
  song: Song;
  index: number;
  onPress: () => void;
  onAddQueue: () => void;
  onRemove: () => void;
  onAddToPlaylist: () => void;
}) {
  const currentSong = useStore((s) => s.currentSong);
  const toggleLike = useStore((s) => s.toggleLike);
  const isSongLiked = useStore((s) => s.isSongLiked);
  const isCurrent = currentSong?.id === song.id;
  const liked = isSongLiked(song.id);
  const imageUrl = getBestImageUrl(song.image);
  const artist = song.artists?.primary?.map((a) => a.name).join(', ') ?? '';
  const [showOptions, setShowOptions] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.trackItem, isCurrent && styles.trackItemActive]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.trackIndex, isCurrent && styles.trackIndexActive]}>
          {isCurrent ? (
            <Ionicons name="musical-note" size={13} color="#A855F7" />
          ) : (
            index
          )}
        </Text>
        <Image
          source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')}
          style={styles.trackImage}
          resizeMode="cover"
        />
        <View style={styles.trackInfo}>
          <Text style={[styles.trackName, isCurrent && styles.trackNameActive]} numberOfLines={1}>
            {song.name}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>{artist}</Text>
        </View>
        <Text style={styles.trackDuration}>{formatMs(song.duration * 1000)}</Text>
        <TouchableOpacity
          onPress={() => toggleLike(song)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.heartBtn}
        >
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={15} color={liked ? '#A855F7' : '#374151'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.trackMore}
          onPress={() => setShowOptions(true)}
        >
          <Ionicons name="ellipsis-vertical" size={16} color="#4B5563" />
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
          {
            label: 'Remove from Playlist',
            icon: 'trash-outline',
            style: 'destructive',
            onPress: onRemove,
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#08080F', gap: 12 },
  errorText: { color: '#6B7280', fontSize: 16 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1C1C35',
  },
  retryText: { color: '#A855F7', fontWeight: '700' },

  blob1: {
    position: 'absolute',
    top: -60,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4C1D9520',
  },
  blob2: {
    position: 'absolute',
    bottom: 100,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#7C3AED15',
  },

  listContent: { paddingBottom: 140 },

  backBtn: {
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C35',
    alignItems: 'center',
    justifyContent: 'center',
  },

  artWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  art: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: 16,
  },
  artPlaceholder: {
    backgroundColor: '#1C0F33',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoBlock: { paddingHorizontal: 20, marginBottom: 20, alignItems: 'center' },
  playlistName: {
    color: '#F9FAFB',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 6,
  },
  meta: { color: '#6B7280', fontSize: 13 },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  playAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#A855F7',
  },
  playAllText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  shuffleBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#A855F750',
    backgroundColor: '#1C0F33',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tracksLabel: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  emptyTracks: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyTrackText: { color: '#374151', fontSize: 15, fontWeight: '700' },
  emptyTrackSub: { color: '#2D2D40', fontSize: 12 },

  // Track row
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 12,
  },
  trackItemActive: {
    backgroundColor: '#1A0F30',
    borderWidth: 1,
    borderColor: '#3B1F6A',
  },
  trackIndex: { width: 24, color: '#4B5563', fontSize: 12, fontWeight: '600', textAlign: 'center', marginRight: 10 },
  trackIndexActive: { color: '#A855F7' },
  trackImage: { width: 42, height: 42, borderRadius: 8, marginRight: 12 },
  trackInfo: { flex: 1 },
  trackName: { color: '#D1D5DB', fontSize: 13, fontWeight: '600' },
  trackNameActive: { color: '#C084FC' },
  trackArtist: { color: '#4B5563', fontSize: 11, marginTop: 2 },
  trackDuration: { color: '#4B5563', fontSize: 11, marginRight: 6 },
  heartBtn: { padding: 5, marginRight: 2 },
  trackMore: { padding: 6 },
});
