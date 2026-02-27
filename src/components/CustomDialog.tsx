import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export interface DialogAction {
  label: string;
  onPress?: () => void;
  /** 'default' = white text | 'cancel' = muted | 'destructive' = red | 'accent' = purple */
  style?: 'default' | 'cancel' | 'destructive' | 'accent';
  /** Ionicons icon name shown on the left of each row (triggers list layout) */
  icon?: keyof typeof Ionicons.glyphMap;
}

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  actions: DialogAction[];
  onDismiss: () => void;
}

/**
 * Themed dialog/action-sheet replacement for native Alert.alert.
 * Layout auto-detects:
 *  - If any action has an `icon` → vertical action-list (action-sheet style)
 *  - Otherwise → centered dialog with inline buttons
 */
export default function CustomDialog({
  visible,
  title,
  message,
  actions,
  onDismiss,
}: Props) {
  const hasIcons = actions.some((a) => a.icon);
  const isActionSheet = hasIcons || actions.filter((a) => a.style !== 'cancel').length > 2;

  const mainActions = actions.filter((a) => a.style !== 'cancel');
  const cancelAction = actions.find((a) => a.style === 'cancel');

  const handleAction = (action: DialogAction) => {
    onDismiss();
    // Delay slightly so the modal closes before the callback fires
    setTimeout(() => action.onPress?.(), 50);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
        <TouchableOpacity style={styles.card} activeOpacity={1} onPress={() => {}}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            {message ? (
              <Text style={styles.message}>{message}</Text>
            ) : null}
          </View>

          {/* ── Action-sheet layout ── */}
          {isActionSheet ? (
            <>
              {mainActions.map((action, i) => (
                <React.Fragment key={i}>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => handleAction(action)}
                    activeOpacity={0.65}
                  >
                    {action.icon ? (
                      <View
                        style={[
                          styles.iconBadge,
                          action.style === 'destructive'
                            ? styles.iconBadgeDestructive
                            : styles.iconBadgeDefault,
                        ]}
                      >
                        <Ionicons
                          name={action.icon}
                          size={16}
                          color={action.style === 'destructive' ? '#EF4444' : '#A855F7'}
                        />
                      </View>
                    ) : null}
                    <Text
                      style={[
                        styles.actionLabel,
                        action.style === 'destructive' && styles.actionLabelDestructive,
                        action.style === 'accent' && styles.actionLabelAccent,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}

              {cancelAction && (
                <>
                  <View style={[styles.divider, styles.cancelDivider]} />
                  <TouchableOpacity
                    style={[styles.actionRow, styles.cancelRow]}
                    onPress={() => handleAction(cancelAction)}
                    activeOpacity={0.65}
                  >
                    <Text style={styles.cancelLabel}>{cancelAction.label}</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            /* ── Button-row layout ── */
            <>
              <View style={styles.divider} />
              <View style={styles.btnRow}>
                {cancelAction && (
                  <TouchableOpacity
                    style={[styles.btn, styles.btnCancel]}
                    onPress={() => handleAction(cancelAction)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.btnCancelText}>{cancelAction.label}</Text>
                  </TouchableOpacity>
                )}
                {mainActions.map((action, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.btn,
                      action.style === 'destructive' ? styles.btnDestructive : styles.btnPrimary,
                    ]}
                    onPress={() => handleAction(action)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.btnText,
                        action.style === 'destructive'
                          ? styles.btnDestructiveText
                          : styles.btnPrimaryText,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  card: {
    width: width * 0.86,
    backgroundColor: '#0E0E1C',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A1F4A',
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    elevation: 24,
  },

  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 6,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  message: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
  },

  divider: {
    height: 1,
    backgroundColor: '#1A1A30',
  },
  cancelDivider: {
    backgroundColor: '#252540',
    marginTop: 4,
  },

  // ── Action-sheet rows ──
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeDefault: {
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.2)',
  },
  iconBadgeDestructive: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  actionLabel: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
  },
  actionLabelDestructive: {
    color: '#EF4444',
  },
  actionLabelAccent: {
    color: '#A855F7',
    fontWeight: '600',
  },

  cancelRow: {
    justifyContent: 'center',
    paddingVertical: 15,
  },
  cancelLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Button-row (dialog) layout ──
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: '#1A1A30',
    borderWidth: 1,
    borderColor: '#2D2D50',
  },
  btnPrimary: {
    backgroundColor: '#7C3AED',
  },
  btnDestructive: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  btnCancelText: {
    color: '#9CA3AF',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
  },
  btnDestructiveText: {
    color: '#EF4444',
  },
});
