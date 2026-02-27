import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../api/saavn';
import { useStore } from '../store/useStore';

interface Props {
  visible: boolean;
  song: Song | null;
  onClose: () => void;
}

export default function PlaylistPickerModal({ visible, song, onClose }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const playlists = useStore((s) => s.playlists);
  const createPlaylist = useStore((s) => s.createPlaylist);
  const addSongToPlaylist = useStore((s) => s.addSongToPlaylist);
  const removeSongFromPlaylist = useStore((s) => s.removeSongFromPlaylist);

  if (!song) return null;

  const isInPlaylist = (playlistId: string) =>
    !!playlists.find((p) => p.id === playlistId)?.songs.find((s) => s.id === song.id);

  const handleToggle = (playlistId: string) => {
    if (isInPlaylist(playlistId)) {
      removeSongFromPlaylist(playlistId, song.id);
    } else {
      addSongToPlaylist(playlistId, song);
      onClose();
    }
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = createPlaylist(trimmed);
    addSongToPlaylist(id, song);
    setNewName('');
    setShowCreate(false);
    onClose();
  };

  const handleClose = () => {
    setShowCreate(false);
    setNewName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredWrapper}
      >
        {/* Backdrop */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableOpacity>

        {/* Popup card */}
        <View style={styles.popup}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="musical-notes" size={18} color="#A855F7" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Add to Playlist</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{song.name}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Playlist list */}
          {playlists.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="list-outline" size={32} color="#2D2D50" />
              <Text style={styles.emptyText}>No playlists yet.</Text>
              <Text style={styles.emptySubText}>Create one below to get started.</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {playlists.map((item) => {
                const inPlaylist = isInPlaylist(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.playlistRow, inPlaylist && styles.playlistRowActive]}
                    onPress={() => handleToggle(item.id)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.playlistIcon, inPlaylist && styles.playlistIconActive]}>
                      <Ionicons name="musical-notes" size={16} color={inPlaylist ? '#A855F7' : '#4B5563'} />
                    </View>
                    <View style={styles.playlistInfo}>
                      <Text style={[styles.playlistName, inPlaylist && styles.playlistNameActive]}>
                        {item.name}
                      </Text>
                      <Text style={styles.playlistCount}>
                        {item.songs.length} song{item.songs.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={[styles.checkbox, inPlaylist && styles.checkboxActive]}>
                      {inPlaylist && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.divider} />

          {/* New playlist inline form */}
          {showCreate ? (
            <View style={styles.createRow}>
              <TextInput
                style={styles.createInput}
                placeholder="Playlist name…"
                placeholderTextColor="#4B5563"
                value={newName}
                onChangeText={setNewName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />
              <TouchableOpacity
                style={[styles.createConfirmBtn, !newName.trim() && { opacity: 0.4 }]}
                onPress={handleCreate}
                disabled={!newName.trim()}
              >
                <Text style={styles.createConfirmText}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createCancelBtn}
                onPress={() => { setShowCreate(false); setNewName(''); }}
              >
                <Ionicons name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.newPlaylistRow} onPress={() => setShowCreate(true)} activeOpacity={0.7}>
              <View style={styles.newPlaylistIcon}>
                <Ionicons name="add" size={18} color="#A855F7" />
              </View>
              <Text style={styles.newPlaylistText}>New Playlist</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  centeredWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  popup: {
    position: 'absolute',
    width: width * 0.86,
    maxHeight: height * 0.65,
    backgroundColor: '#13132A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D2D50',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderWidth: 1,
    borderColor: '#A855F730',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { color: '#F9FAFB', fontSize: 15, fontWeight: '800' },
  subtitle: { color: '#6B7280', fontSize: 11, marginTop: 1 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1C1C3A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  divider: { height: 1, backgroundColor: '#1C1C35' },

  // Empty state
  empty: { paddingVertical: 28, alignItems: 'center', gap: 6 },
  emptyText: { color: '#6B7280', fontSize: 13, fontWeight: '600', marginTop: 4 },
  emptySubText: { color: '#374151', fontSize: 11 },

  // List
  list: { maxHeight: height * 0.32 },

  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 12,
  },
  playlistRowActive: {
    backgroundColor: 'rgba(168,85,247,0.06)',
  },
  playlistIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#1C1C35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistIconActive: {
    backgroundColor: 'rgba(168,85,247,0.18)',
  },
  playlistInfo: { flex: 1 },
  playlistName: { color: '#D1D5DB', fontSize: 13, fontWeight: '600' },
  playlistNameActive: { color: '#C084FC', fontWeight: '700' },
  playlistCount: { color: '#4B5563', fontSize: 11, marginTop: 1 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2D2D50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#A855F7',
    borderColor: '#A855F7',
  },

  // Create form
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  createInput: {
    flex: 1,
    backgroundColor: '#1C1C35',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#F9FAFB',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#2D2D50',
  },
  createConfirmBtn: {
    backgroundColor: '#A855F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  createConfirmText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  createCancelBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#1C1C35',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // New playlist row
  newPlaylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  newPlaylistIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderWidth: 1,
    borderColor: '#A855F730',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPlaylistText: { color: '#A855F7', fontSize: 13, fontWeight: '700' },
});
