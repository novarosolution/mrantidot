import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FileText,
  Gift,
  LayoutGrid,
  MessageSquare,
  Settings,
  Shield,
  UserCircle,
  Users,
  Wrench,
} from 'lucide-react-native';
import { AdminHubLink } from '@/components/kit/AdminHubLink';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { userInitial } from '@/lib/userInitials';
import { colors, design, fonts, premium, spacing } from '@/constants/theme';

const CONTENT_LINKS = [
  { icon: LayoutGrid, label: 'Home & promo', desc: 'Banner, featured service, filters', href: '/(admin)/content' as const },
  { icon: Wrench, label: 'Services', desc: 'Pest types and service catalog', href: '/(admin)/services' as const },
  { icon: Gift, label: 'Offers', desc: 'Coupons and checkout discounts', href: '/(admin)/offers' as const },
  { icon: MessageSquare, label: 'Reviews', desc: 'Moderate customer feedback', href: '/(admin)/reviews' as const },
];

const PEOPLE_LINKS = [
  { icon: Shield, label: 'Users & roles', desc: 'Admins, customers, technicians', href: '/(admin)/users' as const },
  { icon: Users, label: 'Technicians', desc: 'Field team and availability', href: '/(admin)/technicians' as const },
  { icon: UserCircle, label: 'Customers', desc: 'Accounts, spend, and VIP tags', href: '/(admin)/customers' as const },
];

const SYSTEM_LINKS = [
  { icon: Settings, label: 'Settings', desc: 'Profile and sign out', href: '/(admin)/settings' as const },
];

export default function TeamHubScreen() {
  const { user } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const initial = userInitial(user?.name);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <AdminScreenHeader
        title="Manage"
        subtitle="Content, team & catalog"
        userInitial={initial}
        unreadCount={unreadCount}
      />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#14532D', '#1A6B3C']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <FileText size={18} color={colors.lime} />
          <Text style={styles.heroTitle}>Control center</Text>
          <Text style={styles.heroSub}>Edit what customers see and manage your team from one place.</Text>
        </LinearGradient>

        <AdminSectionTitle title="Content & catalog" />
        <View style={styles.links}>
          {CONTENT_LINKS.map((l) => (
            <AdminHubLink key={l.href} {...l} onPress={() => router.push(l.href)} />
          ))}
        </View>

        <AdminSectionTitle title="People" />
        <View style={styles.links}>
          {PEOPLE_LINKS.map((l) => (
            <AdminHubLink key={l.href} {...l} onPress={() => router.push(l.href)} />
          ))}
        </View>

        <AdminSectionTitle title="Account" />
        <View style={styles.links}>
          {SYSTEM_LINKS.map((l) => (
            <AdminHubLink key={l.href} {...l} onPress={() => router.push(l.href)} />
          ))}
        </View>

        <View style={styles.addBlock}>
          <Text style={styles.addTitle}>Quick add</Text>
          <Button
            title="Add technician"
            variant="premium"
            onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { role: 'technician' } })}
          />
          <Button
            title="Add customer"
            variant="secondary"
            onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { role: 'customer' } })}
          />
          <Button
            title="Add admin"
            variant="secondary"
            onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { role: 'admin' } })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  flex: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  hero: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: 20,
    padding: spacing.lg,
    gap: 8,
    ...premium.shadowSoft,
  },
  heroTitle: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.lime },
  heroSub: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 19 },
  links: { paddingHorizontal: spacing.md, gap: spacing.sm },
  addBlock: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...premium.shadowSoft,
  },
  addTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, marginBottom: 4 },
});
