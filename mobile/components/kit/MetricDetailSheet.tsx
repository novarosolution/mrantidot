import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export type MetricDetailRow = {
  key: string;
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
};

export function MetricDetailSheet({
  visible,
  title,
  message,
  rows,
  onClose,
  actionLabel,
  onAction,
}: {
  visible: boolean;
  title: string;
  message?: string;
  rows: MetricDetailRow[];
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <ScrollView style={styles.list} bounces={false}>
            {rows.length === 0 ? (
              <Text style={styles.empty}>No items for this period.</Text>
            ) : (
              rows.map((row) => (
                <Pressable
                  key={row.key}
                  style={({ pressed }) => [styles.row, pressed && row.onPress && styles.rowPressed]}
                  onPress={row.onPress}
                  disabled={!row.onPress}
                >
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {row.title}
                    </Text>
                    {row.subtitle ? (
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {row.subtitle}
                      </Text>
                    ) : null}
                    {row.meta ? <Text style={styles.rowMeta}>{row.meta}</Text> : null}
                  </View>
                  {row.onPress ? <ChevronRight size={18} color={colors.muted} /> : null}
                </Pressable>
              ))
            )}
          </ScrollView>
          {actionLabel && onAction ? (
            <Pressable style={styles.action} onPress={onAction}>
              <Text style={styles.actionText}>{actionLabel}</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: premium.radiusCard,
    borderTopRightRadius: premium.radiusCard,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: '82%',
    ...premium.shadowSoft,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: { fontFamily: fonts.displayExtra, fontSize: 17, color: colors.ink },
  message: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 19 },
  list: { marginTop: spacing.md, maxHeight: 360 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, paddingVertical: spacing.lg, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: { opacity: 0.7 },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  rowSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  rowMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.forest, marginTop: 4 },
  action: {
    marginTop: spacing.md,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
  },
  actionText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.secondaryDark },
  cancel: {
    marginTop: spacing.sm,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  cancelText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.muted },
});
