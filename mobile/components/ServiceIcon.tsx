import { Bug, Bird, Droplets, Sparkles, SprayCan, Waves } from 'lucide-react-native';
import { colors } from '@/constants/theme';

const MAP: Record<string, React.ComponentType<{ color?: string; size?: number }>> = {
  spray: SprayCan,
  mosq: Waves,
  mouse: Bug,
  bed: Sparkles,
  termite: Droplets,
  clean: Sparkles,
  bird: Bird,
};

export function ServiceIcon({ iconKey, size = 24, color = colors.lime }: { iconKey: string; size?: number; color?: string }) {
  const Icon = MAP[iconKey] ?? SprayCan;
  return <Icon size={size} color={color} />;
}
