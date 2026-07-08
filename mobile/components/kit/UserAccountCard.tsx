import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { displayUserEmail, displayUserName } from '@/lib/profile-display';
import type { UserRole } from '@/types/api';
import { colors, customerType, fonts, gradients, premium, shadows, spacing } from '@/constants/theme';

const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  technician: 'Technician',
  admin: 'Admin',
};

export function UserAccountCard({
  compact,
  embedded,
  onPress,
}: {
  compact?: boolean;
  /** Render without outer card — for glass panels. */
  embedded?: boolean;
  onPress?: () => void;
}) {
  const { user } = useAuth();
  if (!user) return null;

  const displayName = displayUserName(user);
  const contact = user.phone?.trim() || displayUserEmail(user.email) || '';
  const initial = displayName[0]?.toUpperCase() ?? 'U';

  const inner = (
    <View style={styles.inner}>
      <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <LinearGradient colors={[...gradients.avatarRing]} style={styles.avatarRing}>
        <LinearGradient colors={['#14532D', '#1E8E4E']} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.avatarText}>{initial}</Text>
        </LinearGradient>
      </LinearGradient>
      <View style={styles.flex}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        {contact ? (
          <Text style={styles.contact} numberOfLines={1}>
            {contact}
          </Text>
        ) : null}
        {user.city ? (
          <Text style={styles.city} numberOfLines={1}>
            {user.city}
          </Text>
        ) : null}
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{ROLE_LABELS[user.role] ?? user.role}</Text>
      </View>
    </View>
  );

  if (embedded) {
    return <View style={[styles.wrap, compact && styles.compact, styles.embedded]}>{inner}</View>;
  }

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[styles.wrap, compact && styles.compact]}>
        <Card variant="premium" style={styles.card}>
          {inner}
        </Card>
      </Pressable>
    );
  }

  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <Card variant="premium" style={styles.card}>
        {inner}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  compact: { marginHorizontal: 0, marginBottom: spacing.md },
  embedded: { marginBottom: 0 },
  card: { padding: 0, overflow: 'hidden', ...shadows.card },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md, position: 'relative' },
  goldBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  avatarRing: {
    width: 54,
    height: 54,
    borderRadius: 18,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.white, letterSpacing: -0.2 },
  flex: { flex: 1, minWidth: 0 },
  name: { ...customerType.accountName },
  contact: { ...customerType.accountMeta },
  city: { ...customerType.listMeta, fontSize: 11, marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.15)',
  },
  badgeText: { ...customerType.pillLabel, color: colors.forest },
});
