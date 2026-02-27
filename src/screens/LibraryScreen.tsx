import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import CustomDialog from '../components/CustomDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { RootStackParamList } from '../../App';
import { getBestImageUrl } from '../api/saavn';

type Nav = StackNavigationProp<RootStackParamList>;

const TABS = ['Queue', 'Albums', 'Playlists'] as const;
type Tab = typeof TABS[number];

const { width } = Dimensions.get('window');
const ALBUM_COL = 2;
const ALBUM_SIZE = (width - 48) / ALBUM_COL;

export default function LibraryScreen() {
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<Tab>('Queue');
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [playlistMenu, setPlaylistMenu] = useState<{ id: string; name: string } | null>(null);

  const {
    queue,
    queueIndex,
    playFromQueue,
    clearQueue,
    removeFromQueue,
    reorderQueue,
    savedAlbums,
    unsaveAlbum,
    likedSongs,
    playlists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
  } = useStore();

  const handlePlay = (index: number) => {
    playFromQueue(index);
    navigation.navigate('Player');
  };

  const handleCreatePlaylist = () => {
    const trimmed = newPlaylistName.trim();
    if (!trimmed) return;
    createPlaylist(trimmed);
    setNewPlaylistName('');
    setShowNewPlaylist(false);
  };

  const handleDeletePlaylist = (id: string, name: string) => {
    deletePlaylist(id);
  };

  const handleRenamePlaylist = (id: string, current: string) => {
    setRenameTarget({ id, name: current });
    setRenameInput(current);
  };

  const confirmRename = () => {
    if (renameTarget && renameInput.trim()) {
      renamePlaylist(renameTarget.id, renameInput.trim());
    }
    setRenameTarget(null);
    setRenameInput('');
  };

  const handleUnsaveAlbum = (albumId: string, albumName: string) => {
    unsaveAlbum(albumId);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Library</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab}
              </Text>
              {tab === 'Queue' && queue.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{queue.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Queue Tab ── */}
        {activeTab === 'Queue' && (
          <>
            {queue.length > 0 && (
              <TouchableOpacity onPress={clearQueue} style={styles.clearBtn} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={13} color="#EF4444" />
                <Text style={styles.clearText}>Clear Queue</Text>
              </TouchableOpacity>
            )}
            {queue.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="music-off" size={44} color="#2D2D40" />
                <Text style={styles.emptyTitle}>Your queue is empty</Text>
                <Text style={styles.emptySubtitle}>Songs you add will appear here</Text>
              </View>
            ) : (
              <FlatList
                data={queue}
                keyExtractor={(item, i) => `${item.id}-${i}`}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                  <Text style={styles.count}>{queue.length} songs in queue</Text>
                }
                renderItem={({ item, index }) => {
                  const isCurrent = index === queueIndex;
                  const artist = item.artists?.primary?.map((a) => a.name).join(', ') ?? '';
                  return (
                    <TouchableOpacity
                      style={[styles.queueItem, isCurrent && styles.queueItemCurrent]}
                      onPress={() => handlePlay(index)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.indexBox, isCurrent && styles.indexBoxActive]}>
                        {isCurrent ? (
                          <Ionicons name="musical-note" size={14} color="#A855F7" />
                        ) : (
                          <Text style={styles.indexText}>{index + 1}</Text>
                        )}
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, isCurrent && styles.itemNameCurrent]} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.itemArtist} numberOfLines={1}>{artist}</Text>
                      </View>
                      <View style={styles.itemActions}>
                        <TouchableOpacity
                          onPress={() => reorderQueue(index, index - 1)}
                          disabled={index === 0}
                          activeOpacity={0.7}
                          style={styles.actionBtn}
                        >
                          <Ionicons name="chevron-up" size={16} color={index === 0 ? '#2D2D40' : '#6B7280'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => reorderQueue(index, index + 1)}
                          disabled={index === queue.length - 1}
                          activeOpacity={0.7}
                          style={styles.actionBtn}
                        >
                          <Ionicons name="chevron-down" size={16} color={index === queue.length - 1 ? '#2D2D40' : '#6B7280'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removeFromQueue(index)}
                          activeOpacity={0.7}
                          style={styles.actionBtn}
                        >
                          <Ionicons name="trash-outline" size={15} color="#EF444480" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </>
        )}

        {/* ── Albums Tab ── */}
        {activeTab === 'Albums' && (
          <>
            {savedAlbums.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="albums-outline" size={44} color="#2D2D40" />
                <Text style={styles.emptyTitle}>No saved albums</Text>
                <Text style={styles.emptySubtitle}>Save albums to find them here</Text>
              </View>
            ) : (
              <FlatList
                data={savedAlbums}
                keyExtractor={(item) => item.id}
                numColumns={ALBUM_COL}
                contentContainerStyle={styles.albumGrid}
                columnWrapperStyle={styles.albumRow}
                ListHeaderComponent={
                  <Text style={styles.count}>{savedAlbums.length} saved album{savedAlbums.length !== 1 ? 's' : ''}</Text>
                }
                renderItem={({ item }) => {
                  const imgUrl = getBestImageUrl(item.image);
                  const artist = item.artists?.primary?.map((a) => a.name).join(', ') ?? '';
                  return (
                    <TouchableOpacity
                      style={[styles.albumCard, { width: ALBUM_SIZE }]}
                      onPress={() => navigation.navigate('Album', { albumId: item.id })}
                      activeOpacity={0.8}
                      onLongPress={() => handleUnsaveAlbum(item.id, item.name)}
                    >
                      <Image
                        source={imgUrl ? { uri: imgUrl } : require('../../assets/icon.png')}
                        style={[styles.albumArt, { width: ALBUM_SIZE, height: ALBUM_SIZE }]}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.albumUnsaveBtn}
                        onPress={() => handleUnsaveAlbum(item.id, item.name)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="heart" size={16} color="#A855F7" />
                      </TouchableOpacity>
                      <View style={styles.albumInfo}>
                        <Text style={styles.albumName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.albumArtist} numberOfLines={1}>{artist}</Text>
                        {item.year ? <Text style={styles.albumYear}>{item.year}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </>
        )}

        {/* ── Playlists Tab ── */}
        {activeTab === 'Playlists' && (
          <>
            <TouchableOpacity
              style={styles.newPlaylistBtn}
              onPress={() => setShowNewPlaylist(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={18} color="#A855F7" />
              <Text style={styles.newPlaylistText}>New Playlist</Text>
            </TouchableOpacity>

            {/* Liked Songs pinned card */}
            <TouchableOpacity
              style={styles.likedCard}
              onPress={() => navigation.navigate('LikedSongs')}
              activeOpacity={0.8}
            >
              <View style={styles.likedIcon}>
                <Ionicons name="heart" size={22} color="#A855F7" />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.playlistName}>Liked Songs</Text>
                <Text style={styles.playlistCount}>{likedSongs.length} song{likedSongs.length !== 1 ? 's' : ''}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#374151" />
            </TouchableOpacity>

            {playlists.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="playlist-music-outline" size={44} color="#2D2D40" />
                <Text style={styles.emptyTitle}>No playlists yet</Text>
                <Text style={styles.emptySubtitle}>Create a playlist to get started</Text>
              </View>
            ) : (
              <FlatList
                data={playlists}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.playlistItem}
                    onPress={() => navigation.navigate('Playlist', { playlistId: item.id })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.playlistIcon}>
                      <Ionicons name="musical-notes" size={20} color="#A855F7" />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.playlistCount}>{item.songs.length} song{item.songs.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => setPlaylistMenu({ id: item.id, name: item.name })}
                    >
                      <Ionicons name="ellipsis-vertical" size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}
      </SafeAreaView>

      {/* New Playlist Modal */}
      <Modal
        visible={showNewPlaylist}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewPlaylist(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNewPlaylist(false)}
        >
          <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
            <Text style={styles.modalTitle}>New Playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Playlist name"
              placeholderTextColor="#4B5563"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
              onSubmitEditing={handleCreatePlaylist}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setShowNewPlaylist(false); setNewPlaylistName(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateBtn, !newPlaylistName.trim() && { opacity: 0.4 }]}
                onPress={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
              >
                <Text style={styles.modalCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Rename Playlist Modal */}
      <Modal
        visible={renameTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameTarget(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRenameTarget(null)}
        >
          <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
            <Text style={styles.modalTitle}>Rename Playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="New name"
              placeholderTextColor="#4B5563"
              value={renameInput}
              onChangeText={setRenameInput}
              autoFocus
              onSubmitEditing={confirmRename}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRenameTarget(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateBtn, !renameInput.trim() && { opacity: 0.4 }]}
                onPress={confirmRename}
                disabled={!renameInput.trim()}
              >
                <Text style={styles.modalCreateText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Playlist options dialog */}
      <CustomDialog
        visible={playlistMenu !== null}
        title={playlistMenu?.name ?? ''}
        actions={[
          {
            label: 'Rename',
            icon: 'pencil-outline',
            onPress: () => playlistMenu && handleRenamePlaylist(playlistMenu.id, playlistMenu.name),
          },
          {
            label: 'Delete',
            icon: 'trash-outline',
            style: 'destructive',
            onPress: () => playlistMenu && handleDeletePlaylist(playlistMenu.id, playlistMenu.name),
          },
          { label: 'Cancel', style: 'cancel' },
        ]}
        onDismiss={() => setPlaylistMenu(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08080F' },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#111122',
    gap: 5,
  },
  tabActive: {
    backgroundColor: 'rgba(168,85,247,0.18)',
    borderWidth: 1,
    borderColor: '#A855F740',
  },
  tabLabel: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: '#C084FC', fontWeight: '700' },
  tabBadge: {
    backgroundColor: '#A855F7',
    borderRadius: 8,
    minWidth: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Clear button
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-end',
    marginRight: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#1A0A0A',
    borderWidth: 1,
    borderColor: '#EF444430',
  },
  clearText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },

  // Empty
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { color: '#3D3D55', fontSize: 15, fontWeight: '700', marginTop: 4 },
  emptySubtitle: { color: '#2D2D40', fontSize: 13 },

  list: { paddingBottom: 120 },
  count: { color: '#4B5563', fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.3, paddingHorizontal: 16 },

  // Queue items
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginHorizontal: 8,
    marginTop: 4,
    borderRadius: 12,
  },
  queueItemCurrent: {
    backgroundColor: '#1A0F30',
    borderWidth: 1,
    borderColor: '#3B1F6A',
  },
  indexBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#161625',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  indexBoxActive: {
    backgroundColor: '#2A1050',
    borderWidth: 1,
    borderColor: '#A855F730',
  },
  indexText: { color: '#4B5563', fontSize: 11, fontWeight: '700' },
  itemInfo: { flex: 1 },
  itemName: { color: '#D1D5DB', fontSize: 13, fontWeight: '600' },
  itemNameCurrent: { color: '#C084FC', fontWeight: '700' },
  itemArtist: { color: '#4B5563', fontSize: 11, marginTop: 2 },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 6 },

  // Album grid
  albumGrid: { paddingHorizontal: 16, paddingBottom: 120 },
  albumRow: { gap: 16, marginBottom: 20 },
  albumCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111122',
  },
  albumArt: { borderRadius: 8 },
  albumUnsaveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    padding: 4,
  },
  albumInfo: { padding: 8 },
  albumName: { color: '#E5E7EB', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  albumArtist: { color: '#6B7280', fontSize: 11 },
  albumYear: { color: '#4B5563', fontSize: 10, marginTop: 2 },

  // Playlist list
  newPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A855F730',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(168,85,247,0.05)',
  },
  newPlaylistText: { color: '#A855F7', fontSize: 14, fontWeight: '600' },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: '#0F0F1E',
  },
  playlistIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1C0F33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playlistName: { color: '#E5E7EB', fontSize: 14, fontWeight: '700' },
  playlistCount: { color: '#6B7280', fontSize: 12, marginTop: 2 },

  // Liked Songs card
  likedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#1C0F33',
    borderWidth: 1,
    borderColor: '#A855F730',
  },
  likedIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(168,85,247,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: width * 0.82,
    backgroundColor: '#13132A',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D2D50',
  },
  modalTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#1C1C35',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F9FAFB',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2D2D50',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  modalCancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#1C1C35',
  },
  modalCancelText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  modalCreateBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#A855F7',
  },
  modalCreateText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});