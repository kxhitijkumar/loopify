import React from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function QueueModal({ visible, onClose }: Props) {
  const {
    queue,
    queueIndex,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    playFromQueue,
  } = useStore();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Queue ({queue.length})</Text>
          <View style={styles.headerBtns}>
            <TouchableOpacity
              onPress={clearQueue}
              activeOpacity={0.7}
              style={styles.clearBtn}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={queue}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item, index }) => {
            const isCurrent = index === queueIndex;
            return (
              <View style={[styles.item, isCurrent && styles.currentItem]}>
                <TouchableOpacity
                  style={styles.itemInfo}
                  onPress={() => playFromQueue(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemNameRow}>
                    {isCurrent ? (
                      <Ionicons
                        name="musical-note"
                        size={12}
                        color="#A855F7"
                        style={styles.currentIcon}
                      />
                    ) : null}
                    <Text
                      style={[styles.itemName, isCurrent && styles.currentText]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </View>
                  <Text style={styles.itemArtist} numberOfLines={1}>
                    {item.artists?.primary?.map((a) => a.name).join(', ')}
                  </Text>
                </TouchableOpacity>

                <View style={styles.itemActions}>
                  <TouchableOpacity
                    onPress={() => reorderQueue(index, index - 1)}
                    disabled={index === 0}
                    activeOpacity={0.7}
                    style={styles.arrowBtn}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={16}
                      color={index === 0 ? '#404040' : '#FFFFFF'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => reorderQueue(index, index + 1)}
                    disabled={index === queue.length - 1}
                    activeOpacity={0.7}
                    style={styles.arrowBtn}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={index === queue.length - 1 ? '#404040' : '#FFFFFF'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeFromQueue(index)}
                    activeOpacity={0.7}
                    style={styles.arrowBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No songs in queue</Text>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08080F' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  title: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1A0A0A',
    borderWidth: 1,
    borderColor: '#EF444430',
  },
  clearText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  closeBtn: { color: '#FFFFFF', fontSize: 20 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0F0F1A',
  },
  currentItem: { backgroundColor: '#120D1F' },
  itemInfo: { flex: 1 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center' },
  currentIcon: { marginRight: 6 },
  itemName: { color: '#E5E7EB', fontSize: 14, fontWeight: '500' },
  currentText: { color: '#A855F7', fontWeight: '700' },
  itemArtist: { color: '#6B7280', fontSize: 12, marginTop: 3 },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  arrowBtn: { padding: 8 },
  emptyText: {
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 60,
    fontSize: 15,
  },
});