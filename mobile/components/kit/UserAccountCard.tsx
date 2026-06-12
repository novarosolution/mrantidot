import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { displayUserEmail, displayUserName } from '@/lib/profile-display';
import type { UserRole } from '@/types/api';
import { colors, fonts, gradients, spacing, surfaces } from '@/constants/theme';

const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  technician: 'Technician',
  admin: 'Admin',
};

export function UserAccountCard({ compact, onPress }: { compact?: boolean; onPress?: () => void }) {
  const { user } = useAuth();
  if (!user) return null;

  const displayName = displayUserName(user);
  const contact = user.phone?.trim() || displayUserEmail(user.email) || '';
  const initial = displayName[0]?.toUpperCase() ?? 'U';

  const inner = (
    <View style={styles.inner}>
      <LinearGradient colors={[...gradients.avatarRing]} style={styles.avatarRing}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
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
  card: { padding: spacing.md },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 16,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 16, color: colors.white },
  flex: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  contact: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  city: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  badge: {
    backgroundColor: surfaces.tintInfo,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 10, color: surfaces.tintInfoInk },
});
