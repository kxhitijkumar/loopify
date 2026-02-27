import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import CustomDialog, { DialogAction } from './CustomDialog';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Song, getBestImageUrl, formatMs } from '../api/saavn';
import { useStore } from '../store/useStore';
import PlaylistPickerModal from './PlaylistPickerModal';

interface Props {
  song: Song;
  index: number;
  onPress: () => void;
}

export default function SongItem({ song, index, onPress }: Props) {
  const addToQueue = useStore((s) => s.addToQueue);
  const addToQueueNext = useStore((s) => s.addToQueueNext);
  const currentSong = useStore((s) => s.currentSong);
  const isPlaying = useStore((s) => s.isPlaying);
  const toggleLike = useStore((s) => s.toggleLike);
  const isSongLiked = useStore((s) => s.isSongLiked);
  const scale = useRef(new Animated.Value(1)).current;
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);

  const imageUrl = getBestImageUrl(song.image);
  const artistNames = song.artists?.primary?.map((a) => a.name).join(', ') ?? '';
  const isCurrentSong = currentSong?.id === song.id;
  const liked = isSongLiked(song.id);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  const handleAddToPlaylist = () => {
    setShowPlaylistPicker(true);
  };

  const handleOptions = () => setShowOptionsDialog(true);

  const optionsActions: DialogAction[] = [
    { label: 'Play Now', icon: 'play-circle-outline', onPress },
    {
      label: 'Play Next',
      icon: 'play-skip-forward-outline',
      onPress: () => addToQueueNext(song),
    },
    {
      label: 'Add to Queue',
      icon: 'add-circle-outline',
      onPress: () => addToQueue(song),
    },
    {
      label: liked ? 'Unlike' : 'Like',
      icon: liked ? 'heart-dislike-outline' : 'heart-outline',
      onPress: () => toggleLike(song),
    },
    {
      label: 'Add to Playlist',
      icon: 'list-outline',
      onPress: handleAddToPlaylist,
    },
    { label: 'Cancel', style: 'cancel' },
  ];

  return (
    <>
      <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.container, isCurrentSong && styles.containerActive]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Index / Playing indicator */}
        <View style={styles.indexContainer}>
          {isCurrentSong && isPlaying ? (
            <Ionicons name="musical-note" size={14} color="#A78BFA" />
          ) : (
            <Text style={[styles.index, isCurrentSong && styles.indexActive]}>
              {String(index + 1).padStart(2, '0')}
            </Text>
          )}
        </View>

        {/* Album art */}
        <View style={styles.imageWrapper}>
          <Image
            source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')}
            style={styles.image}
            resizeMode="cover"
          />
          {isCurrentSong && (
            <View style={styles.imageOverlay}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={16}
                color="#FFFFFF"
              />
            </View>
          )}
        </View>

        {/* Song info */}
        <View style={styles.info}>
          <Text
            style={[styles.name, isCurrentSong && styles.nameActive]}
            numberOfLines={1}
          >
            {song.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.artist} numberOfLines={1}>
              {artistNames}
            </Text>
            {song.album?.name ? (
              <>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.album} numberOfLines={1}>
                  {song.album.name}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Duration + heart + menu */}
        <View style={styles.right}>
          <Text style={styles.duration}>
            {formatMs((song.duration ?? 0) * 1000)}
          </Text>
          <View style={styles.rightActions}>
            <TouchableOpacity
              onPress={() => toggleLike(song)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={16}
                color={liked ? '#A855F7' : '#374151'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOptions}
              activeOpacity={0.7}
              style={styles.menuBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="more-vertical" size={16} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>

      <PlaylistPickerModal
        visible={showPlaylistPicker}
        song={song}
        onClose={() => setShowPlaylistPicker(false)}
      />

      <CustomDialog
        visible={showOptionsDialog}
        title={song.name}
        message={artistNames}
        actions={optionsActions}
        onDismiss={() => setShowOptionsDialog(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  containerActive: {
    backgroundColor: '#13131F',
    borderWidth: 1,
    borderColor: '#2D1F4E',
  },
  indexContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 10,
  },
  index: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '600',
  },
  indexActive: {
    color: '#A78BFA',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#1F1F2E',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  nameActive: {
    color: '#A78BFA',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  artist: {
    color: '#6B7280',
    fontSize: 12,
    flexShrink: 1,
  },
  dot: {
    color: '#374151',
    fontSize: 12,
  },
  album: {
    color: '#4B5563',
    fontSize: 12,
    flexShrink: 1,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  duration: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '500',
  },
  menuBtn: {
    padding: 2,
  },
});