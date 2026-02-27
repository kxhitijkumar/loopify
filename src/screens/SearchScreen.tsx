import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { searchSongs, Song, getBestImageUrl, formatMs, searchAlbums, Album } from '../api/saavn';
import { RootStackParamList } from '../../App';

type Nav = StackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

const CATEGORIES = [
  { label: 'Hip-Hop', color: '#DC2626', bg: '#200808', icon: 'microphone-variant' },
  { label: 'Pop', color: '#D97706', bg: '#1C1005', icon: 'star-four-points' },
  { label: 'Rock', color: '#7C3AED', bg: '#160A2E', icon: 'lightning-bolt' },
  { label: 'Electronic', color: '#0891B2', bg: '#031622', icon: 'equalizer' },
  { label: 'Jazz', color: '#059669', bg: '#021A11', icon: 'saxophone' },
  { label: 'Classical', color: '#BE185D', bg: '#220A1A', icon: 'violin' },
  { label: 'Bollywood', color: '#EA580C', bg: '#1E0A02', icon: 'music-note-eighth' },
  { label: 'Lo-Fi', color: '#8B5CF6', bg: '#120A2E', icon: 'headphones' },
  { label: 'R&B', color: '#0284C7', bg: '#021222', icon: 'heart-music-note-outline' },
  { label: 'Latin', color: '#F59E0B', bg: '#1C1002', icon: 'fire' },
];

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [albumResults, setAlbumResults] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [albumPage, setAlbumPage] = useState(1);
  const [albumHasMore, setAlbumHasMore] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'songs' | 'albums'>('songs');

  const { addToQueue, setCurrentSong, pendingMoodQuery, setPendingMoodQuery } = useStore();

  const doSearch = useCallback(async (q: string, p = 1) => {
    if (!q.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await searchSongs(q, p);
      if (p === 1) {
        setResults(res);
      } else {
        setResults((prev) => [...prev, ...res]);
      }
      setPage(p);
      setHasMore(res.length === 20);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const doSearchAlbums = useCallback(async (q: string, p = 1) => {
    if (!q.trim()) return;
    setAlbumLoading(true);
    try {
      const res = await searchAlbums(q, p, 20);
      if (p === 1) {
        setAlbumResults(res);
      } else {
        setAlbumResults((prev) => [...prev, ...res]);
      }
      setAlbumPage(p);
      setAlbumHasMore(res.length === 20);
    } catch (e) {
      console.error(e);
    } finally {
      setAlbumLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (pendingMoodQuery) {
        setQuery(pendingMoodQuery);
        doSearch(pendingMoodQuery);
        doSearchAlbums(pendingMoodQuery);
        setPendingMoodQuery(null);
      }
    }, [pendingMoodQuery, doSearch, doSearchAlbums, setPendingMoodQuery])
  );

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      setAlbumResults([]);
      setHasSearched(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(text);
      doSearchAlbums(text);
    }, 400);
  };

  const handleCategoryPress = (label: string) => {
    setQuery(label);
    doSearch(label);
    doSearchAlbums(label);
    Keyboard.dismiss();
  };

  const handleSongPress = (song: Song) => {
    setCurrentSong(song);
    navigation.navigate('Player');
  };

  const handleAlbumPress = (album: Album) => {
    navigation.navigate('Album', { albumId: album.id });
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setAlbumResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
          <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
            <Ionicons
              name="search"
              size={18}
              color={isFocused ? '#A855F7' : '#6B7280'}
              style={{ marginRight: 10 }}
            />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Songs, artists, albums..."
              placeholderTextColor="#4B5563"
              value={query}
              onChangeText={handleChangeText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              returnKeyType="search"
              onSubmitEditing={() => doSearch(query)}
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!hasSearched ? (
          // Browse Categories
          <FlatList
            key="search-categories"
            data={CATEGORIES}
            keyExtractor={(item) => item.label}
            numColumns={2}
            columnWrapperStyle={styles.categoryRow}
            contentContainerStyle={styles.categoryList}
            ListHeaderComponent={
              <Text style={styles.browseTitle}>Browse Categories</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryCard, { backgroundColor: item.bg, borderColor: item.color + '55' }]}
                onPress={() => handleCategoryPress(item.label)}
                activeOpacity={0.75}
              >
                <View style={[styles.categoryIconBg, { backgroundColor: item.color + '22' }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={[styles.categoryLabel, { color: item.color }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          // Search Results
          <View style={{ flex: 1 }}>
            {/* Tab switcher */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'songs' && styles.tabBtnActive]}
                onPress={() => setActiveTab('songs')}
                activeOpacity={0.8}
              >
                <Ionicons name="musical-note" size={14} color={activeTab === 'songs' ? '#fff' : '#6B7280'} />
                <Text style={[styles.tabLabel, activeTab === 'songs' && styles.tabLabelActive]}>Songs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'albums' && styles.tabBtnActive]}
                onPress={() => setActiveTab('albums')}
                activeOpacity={0.8}
              >
                <Ionicons name="disc-outline" size={14} color={activeTab === 'albums' ? '#fff' : '#6B7280'} />
                <Text style={[styles.tabLabel, activeTab === 'albums' && styles.tabLabelActive]}>Albums</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'songs' ? (
              <FlatList
                key="search-results-songs"
                data={results}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.resultsList}
                onEndReached={() => hasMore && !loading && doSearch(query, page + 1)}
                onEndReachedThreshold={0.3}
                ListHeaderComponent={
                  results.length > 0 ? (
                    <Text style={styles.resultsHeader}>
                      {results.length} results for{' '}
                      <Text style={styles.resultsQuery}>"{query}"</Text>
                    </Text>
                  ) : null
                }
                ListEmptyComponent={
                  !loading ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="musical-notes-outline" size={48} color="#374151" />
                      <Text style={styles.emptyText}>No songs found</Text>
                      <Text style={styles.emptySubText}>Try a different search term</Text>
                    </View>
                  ) : null
                }
                ListFooterComponent={
                  loading ? (
                    <ActivityIndicator color="#A855F7" style={{ margin: 20 }} />
                  ) : null
                }
                renderItem={({ item, index }) => (
                  <SearchResultItem
                    song={item}
                    index={index}
                    onPress={() => handleSongPress(item)}
                    onAddQueue={() => addToQueue(item)}
                  />
                )}
              />
            ) : (
              <FlatList
                key="search-results-albums"
                data={albumResults}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.resultsList}
                onEndReached={() => albumHasMore && !albumLoading && doSearchAlbums(query, albumPage + 1)}
                onEndReachedThreshold={0.3}
                ListHeaderComponent={
                  albumResults.length > 0 ? (
                    <Text style={styles.resultsHeader}>
                      {albumResults.length} albums for{' '}
                      <Text style={styles.resultsQuery}>"{query}"</Text>
                    </Text>
                  ) : null
                }
                ListEmptyComponent={
                  !albumLoading ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="disc-outline" size={48} color="#374151" />
                      <Text style={styles.emptyText}>No albums found</Text>
                      <Text style={styles.emptySubText}>Try a different search term</Text>
                    </View>
                  ) : null
                }
                ListFooterComponent={
                  albumLoading ? (
                    <ActivityIndicator color="#A855F7" style={{ margin: 20 }} />
                  ) : null
                }
                renderItem={({ item }) => (
                  <AlbumResultItem album={item} onPress={() => handleAlbumPress(item)} />
                )}
              />
            )}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function SearchResultItem({
  song,
  index,
  onPress,
  onAddQueue,
}: {
  song: Song;
  index: number;
  onPress: () => void;
  onAddQueue: () => void;
}) {
  const imageUrl = getBestImageUrl(song.image);
  const artist = song.artists?.primary?.map((a) => a.name)?.join(', ') ?? 'Unknown Artist';

  return (
    <TouchableOpacity style={styles.resultItem} onPress={onPress} activeOpacity={0.75}>
      <Image
        source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')}
        style={styles.resultImage}
        resizeMode="cover"
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>{song.name}</Text>
        <View style={styles.resultMeta}>
          <Ionicons name="musical-note" size={11} color="#6B7280" />
          <Text style={styles.resultArtist} numberOfLines={1}>{artist}</Text>
          <Text style={styles.resultDot}>·</Text>
          <Text style={styles.resultDuration}>{formatMs((song.duration ?? 0) * 1000)}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onAddQueue}
        style={styles.addBtn}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="add-circle-outline" size={24} color="#7C3AED" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function AlbumResultItem({
  album,
  onPress,
}: {
  album: Album;
  onPress: () => void;
}) {
  const imageUrl = getBestImageUrl(album.image);
  const artist = album.artists?.primary?.map((a) => a.name)?.join(', ') ?? 'Unknown Artist';

  return (
    <TouchableOpacity style={styles.albumResultItem} onPress={onPress} activeOpacity={0.75}>
      <Image
        source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')}
        style={styles.albumResultImage}
        resizeMode="cover"
      />
      <View style={styles.albumResultInfo}>
        <Text style={styles.albumResultName} numberOfLines={1}>{album.name}</Text>
        <View style={styles.albumResultMeta}>
          <Ionicons name="disc-outline" size={11} color="#6B7280" />
          <Text style={styles.albumResultArtist} numberOfLines={1}>{artist}</Text>
          {album.year ? <>
            <Text style={styles.resultDot}>·</Text>
            <Text style={styles.resultDot}>{album.year}</Text>
          </> : null}
        </View>
      </View>
      <TouchableOpacity
        style={styles.albumChevron}
        onPress={onPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-forward" size={18} color="#4B5563" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08080F' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F1A',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: '#1A1A2E',
  },
  searchBarFocused: {
    borderColor: '#7C3AED',
    backgroundColor: '#0D0D1A',
  },
  input: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 15,
    padding: 0,
  },
  // Categories
  browseTitle: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 4,
  },
  categoryList: { paddingBottom: 120 },
  categoryRow: { paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  categoryCard: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2, flex: 1, marginLeft: 10 },
  // Results
  resultsList: { paddingHorizontal: 16, paddingBottom: 120 },
  resultsHeader: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 16,
    marginTop: 4,
  },
  resultsQuery: { color: '#A855F7', fontWeight: '700' },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0F0F1A',
  },
  resultImage: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#1A1A2E',
    marginRight: 14,
  },
  resultInfo: { flex: 1 },
  resultName: { color: '#F3F4F6', fontSize: 14, fontWeight: '600', marginBottom: 5 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultArtist: { color: '#6B7280', fontSize: 12, flexShrink: 1 },
  resultDot: { color: '#374151', fontSize: 12 },
  resultDuration: { color: '#4B5563', fontSize: 12 },
  addBtn: { padding: 6, marginLeft: 8 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: '#6B7280', fontSize: 17, fontWeight: '600' },
  emptySubText: { color: '#374151', fontSize: 13 },
  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0F0F1A',
    borderWidth: 1,
    borderColor: '#1A1A2E',
  },
  tabBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  tabLabel: { color: '#6B7280', fontSize: 13, fontWeight: '700' },
  tabLabelActive: { color: '#fff' },
  // Album result
  albumResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0F0F1A',
  },
  albumResultImage: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#1A1A2E',
    marginRight: 14,
  },
  albumResultInfo: { flex: 1 },
  albumResultName: { color: '#F3F4F6', fontSize: 14, fontWeight: '600', marginBottom: 5 },
  albumResultMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  albumResultArtist: { color: '#6B7280', fontSize: 12, flexShrink: 1 },
  albumChevron: { padding: 6, marginLeft: 8 },
});