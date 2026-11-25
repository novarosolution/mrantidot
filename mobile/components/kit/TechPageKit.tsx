import { Pressable, StyleSheet, Text, View } from 'react-native';
import { adminType, spacing, ui } from '@/constants/theme';

export function TechSectionTitle({
  title,
  hint,
  actionLabel,
  onAction,
  flush,
}: {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Use inside TechScreenGutter — drops extra horizontal inset. */
  flush?: boolean;
}) {
  return (
    <View style={[styles.sectionBlock, flush && styles.sectionFlush]}>
      <View style={styles.sectionRow}>
        <View style={styles.sectionText}>
          <View style={styles.titleCol}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>{title}</Text>
              {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
            </View>
          </View>
        </View>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBlock: { paddingHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.xs },
  sectionFlush: { paddingHorizontal: 0 },
  sectionRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  sectionText: { flex: 1 },
  titleCol: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { ...adminType.sectionTitle, fontSize: 18, color: ui.text },
  sectionHint: { ...adminType.sectionHint, color: ui.textSecondary },
  sectionAction: { ...adminType.sectionLink, paddingTop: 2 },
});
