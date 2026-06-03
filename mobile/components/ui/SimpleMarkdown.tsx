import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '@/constants/theme';

/**
 * Minimal markdown renderer for CMS copy. Supports `# / ## / ###` headings,
 * `- ` bullet lists, and blank-line separated paragraphs. Inline `**bold**`
 * is rendered as semibold. Intentionally dependency-free.
 */
export function SimpleMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <View>
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        const isList = lines.every((l) => l.trim().startsWith('- '));
        if (isList) {
          return (
            <View key={i} style={styles.list}>
              {lines.map((l, j) => (
                <View key={j} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.body}>{renderInline(l.replace(/^\s*-\s+/, ''))}</Text>
                </View>
              ))}
            </View>
          );
        }
        const heading = block.match(/^(#{1,3})\s+(.*)$/);
        if (heading) {
          const level = heading[1].length;
          return (
            <Text key={i} style={[styles.h, level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3]}>
              {heading[2]}
            </Text>
          );
        }
        return (
          <Text key={i} style={styles.para}>
            {renderInline(block)}
          </Text>
        );
      })}
    </View>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <Text key={i} style={styles.bold}>
          {p.slice(2, -2)}
        </Text>
      );
    }
    return p;
  });
}

const styles = StyleSheet.create({
  h: { color: colors.ink, marginBottom: spacing.sm, marginTop: spacing.sm },
  h1: { fontFamily: fonts.displayExtra, fontSize: 24, lineHeight: 30 },
  h2: { fontFamily: fonts.display, fontSize: 19, lineHeight: 25 },
  h3: { fontFamily: fonts.display, fontSize: 16, lineHeight: 22 },
  para: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.ink, marginBottom: spacing.sm },
  body: { flex: 1, fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.ink },
  bold: { fontFamily: fonts.bodyBold, color: colors.ink },
  list: { marginBottom: spacing.sm, gap: 6 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bullet: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.green, lineHeight: 23 },
});
