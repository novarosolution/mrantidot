import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Gift, LayoutGrid, MessageSquare, Settings, Shield, UserCircle, Users, Wrench } from 'lucide-react-native';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { userInitial } from '@/lib/userInitials';
import { colors, design, fonts, spacing } from '@/constants/theme';

const LINKS = [
  { icon: LayoutGrid, label: 'Home & sections', desc: 'Banner, featured service, filters', href: '/(admin)/content' as const },
  { icon: MessageSquare, label: 'Reviews', desc: 'Moderate customer feedback', href: '/(admin)/reviews' as const },
  { icon: Shield, label: 'Users & roles', desc: 'Admins, customers, technicians', href: '/(admin)/users' as const },
  { icon: Users, label: 'Technicians', desc: 'Add, edit, assign field team', href: '/(admin)/technicians' as const },
  { icon: UserCircle, label: 'Customers', desc: 'View, add, and manage accounts', href: '/(admin)/customers' as const },
  { icon: Wrench, label: 'Services', desc: 'Catalog & pricing', href: '/(admin)/services' as const },
  { icon: Gift, label: 'Offers', desc: 'Coupons & discounts', href: '/(admin)/offers' as const },
  { icon: Settings, label: 'Settings', desc: 'Profile & sign out', href: '/(admin)/settings' as const },
];

export default function TeamHubScreen() {
  const { user } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const initial = userInitial(user?.name);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <AdminScreenHeader
        title="Manage"
        subtitle="Team, customers & catalog"
        userInitial={initial}
        unreadCount={unreadCount}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Card variant="premium" key={l.href} onPress={() => router.push(l.href)} style={styles.row}>
              <View style={styles.icon}>
                <Icon size={22} color={colors.green} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.label}>{l.label}</Text>
                <Text style={styles.desc}>{l.desc}</Text>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </Card>
          );
        })}
        <Pressable style={styles.addRow} onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { role: 'admin' } })}>
          <Text style={styles.addText}>+ Add admin</Text>
        </Pressable>
        <Pressable style={styles.addRow} onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { role: 'customer' } })}>
          <Text style={styles.addText}>+ Add customer</Text>
        </Pressable>
        <Pressable style={styles.addRow} onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { role: 'technician' } })}>
          <Text style={styles.addText}>+ Add technician</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  label: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  desc: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  addRow: {
    marginTop: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.green },
});
