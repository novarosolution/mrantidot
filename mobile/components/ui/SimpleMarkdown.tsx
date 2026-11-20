import { type ReactNode } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '@/constants/theme';

/**
 * Minimal markdown renderer for CMS copy. Supports `# / ## / ###` headings, `- ` bullet lists,
 * `1. ` numbered lists and blank-line separated paragraphs. Inline `**bold**`, `*italic*` and
 * `[links](https://…)` are styled. Intentionally dependency-free.
 */
export function SimpleMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return <View>{blocks.map((block, i) => renderBlock(block, String(i)))}</View>;
}

const BULLET = /^\s*-\s+/;
const NUMBERED = /^\s*(\d+)[.)]\s+/;
const HEADING = /^(#{1,3})\s+(.*)$/;

function renderBlock(block: string, key: string): ReactNode {
  const lines = block.split('\n');
  const isList = lines.every((l) => l.trim().startsWith('- '));
  if (isList) {
    return (
      <View key={key} style={styles.list}>
        {lines.map((l, j) => (
          <View key={j} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.body}>{renderInline(l.replace(BULLET, ''))}</Text>
          </View>
        ))}
      </View>
    );
  }
  const isNumbered = lines.every((l) => NUMBERED.test(l));
  if (isNumbered) {
    return (
      <View key={key} style={styles.list}>
        {lines.map((l, j) => (
          <View key={j} style={styles.bulletRow}>
            <Text style={styles.number}>{`${l.match(NUMBERED)?.[1] ?? j + 1}.`}</Text>
            <Text style={styles.body}>{renderInline(l.replace(NUMBERED, ''))}</Text>
          </View>
        ))}
      </View>
    );
  }
  const heading = block.match(HEADING);
  if (heading) {
    const level = heading[1].length;
    return (
      <Text key={key} style={[styles.h, level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3]}>
        {heading[2]}
      </Text>
    );
  }
  // A heading line directly followed by text (no blank line): render the heading, then the rest.
  const firstHeading = lines[0]?.match(HEADING);
  if (firstHeading && lines.length > 1) {
    return (
      <View key={key}>
        {renderBlock(lines[0]!, `${key}-h`)}
        {renderBlock(lines.slice(1).join('\n').trim(), `${key}-b`)}
      </View>
    );
  }
  return (
    <Text key={key} style={styles.para}>
      {renderInline(block)}
    </Text>
  );
}

const INLINE = /(\*\*[^*]+\*\*|\[[^\]\n]+\]\([^)\s]+\)|\*[^*\s][^*\n]*\*)/g;
const LINK = /^\[([^\]\n]+)\]\(([^)\s]+)\)$/;

function openLink(url: string) {
  if (/^(https?:|mailto:|tel:)/i.test(url)) void Linking.openURL(url).catch(() => undefined);
}

function renderInline(text: string) {
  const parts = text.split(INLINE);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) {
      return (
        <Text key={i} style={styles.bold}>
          {p.slice(2, -2)}
        </Text>
      );
    }
    const link = p.match(LINK);
    if (link) {
      const [, label, url] = link;
      return (
        <Text key={i} style={styles.link} onPress={() => openLink(url!)} accessibilityRole="link">
          {label}
        </Text>
      );
    }
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) {
      return (
        <Text key={i} style={styles.italic}>
          {p.slice(1, -1)}
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
  italic: { fontStyle: 'italic' },
  link: { color: colors.forest, textDecorationLine: 'underline', fontFamily: fonts.bodySemi },
  list: { marginBottom: spacing.sm, gap: 6 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bullet: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.green, lineHeight: 23 },
  number: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.green, lineHeight: 23, minWidth: 18 },
});
