import { SERVICE_ICON_MAP } from '@/constants/serviceIcons';
import { AppIcons } from '@/constants/appIcons';
import { colors } from '@/constants/theme';

export function ServiceIcon({
  iconKey,
  size = 24,
  color = colors.lime,
  strokeWidth,
}: {
  iconKey: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const Icon = SERVICE_ICON_MAP[iconKey] ?? AppIcons.brand;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

export { SERVICE_ICON_KEYS, serviceIconLabel } from '@/constants/serviceIcons';
