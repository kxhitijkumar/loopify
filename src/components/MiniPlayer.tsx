import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useStore } from '../store/useStore';
import { getBestImageUrl } from '../api/saavn';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';

type Nav = StackNavigationProp<RootStackParamList>;

export default function MiniPlayer() {
  const navigation = useNavigation<Nav>();
  const { currentSong, isPlaying, position, duration, setIsPlaying, playPrev, playNext } = useStore();

  if (!currentSong) return null;

  const imageUrl = getBestImageUrl(currentSong.image);
  const artistNames =
    currentSong.artists?.primary?.map((a) => a.name).join(', ') ?? '';

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Player')}
      activeOpacity={0.95}
    >
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.row}>
        {/* Artwork */}
        <View style={styles.imageWrapper}>
          <Image
            source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')}
            style={styles.image}
            resizeMode="cover"
          />
          {isPlaying && <View style={styles.imagePulse} />}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {currentSong.name}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {artistNames}
          </Text>
        </View>

        {/* Controls */}
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); playPrev(); }}
          activeOpacity={0.7}
          style={styles.btn}
        >
          <Ionicons name="play-skip-back" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
          activeOpacity={0.7}
          style={styles.playBtn}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color="#FFFFFF"
            style={isPlaying ? undefined : { marginLeft: 2 }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); playNext(); }}
          activeOpacity={0.7}
          style={styles.btn}
        >
          <Ionicons name="play-skip-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#12121E',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 14,
    borderWidth: 1,
    borderColor: '#2A1F4E',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  progressTrack: {
    height: 2,
    backgroundColor: '#1F1F30',
    width: '100%',
  },
  progressFill: {
    height: 2,
    backgroundColor: '#A855F7',
    borderRadius: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  imageWrapper: { position: 'relative' },
  imagePulse: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#A855F7',
    opacity: 0.6,
  },
  image: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1A1A2E',
  },
  info: { flex: 1, marginHorizontal: 12 },
  name: { color: '#F9FAFB', fontSize: 14, fontWeight: '600' },
  artist: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    shadowColor: '#A855F7',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  btn: { padding: 6 },
});