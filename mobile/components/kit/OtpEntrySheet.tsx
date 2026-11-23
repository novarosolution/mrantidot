import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { Button } from '@/components/ui/Button';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import { useReducedMotion } from '@/lib/a11yPrefs';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { haptic } from '@/lib/motion';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';

const CODE_LENGTH = 6;

/**
 * Six-digit customer code entry (start / completion). A wrong or short code shakes the field with a
 * warning / error haptic; the parent plays the success haptic once the server accepts the code.
 */
export function OtpEntrySheet({
  visible,
  title,
  subtitle,
  loading,
  errorTrigger,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  loading?: boolean;
  /** Increment to shake input and signal a failed verify attempt. */
  errorTrigger?: number;
  onClose: () => void;
  onSubmit: (otp: string) => void;
}) {
  const copy = useCustomerUiCopy();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [code, setCode] = useState('');
  const shake = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const shakeField = () => {
    if (reducedRef.current) return;
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };
  const shakeRef = useRef(shakeField);
  shakeRef.current = shakeField;

  useEffect(() => {
    if (!visible) return;
    setCode('');
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (!visible || !errorTrigger) return;
    setCode('');
    haptic('error');
    shakeRef.current();
    inputRef.current?.focus();
  }, [errorTrigger, visible]);

  function submit() {
    if (loading) return;
    if (code.length !== CODE_LENGTH) {
      haptic('warning');
      shakeField();
      return;
    }
    onSubmit(code);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={copy.techClose} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md }]}>
            <View style={styles.handle} />
            <Pressable
              style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={copy.techClose}
            >
              <PremiumIcon icon={AppIcons.ui.close} variant="plain" size="lg" color={colors.muted} />
            </Pressable>

            <View style={styles.iconWrap}>
              <PremiumIcon icon={AppIcons.ui.key} variant="plain" size="xl" color={colors.white} />
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : <View style={styles.subtitleGap} />}

            <Animated.View style={{ transform: [{ translateX: shake }] }}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                {...textInputDefaults}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, CODE_LENGTH))}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={CODE_LENGTH}
                placeholder="000000"
                placeholderTextColor={colors.muted}
                textAlign="center"
                returnKeyType="done"
                onSubmitEditing={submit}
                editable={!loading}
                accessibilityLabel={copy.techOtpInputA11y}
              />
            </Animated.View>

            <Button
              title={loading ? copy.techOtpVerifying : copy.techOtpVerify}
              onPress={submit}
              disabled={loading || code.length !== CODE_LENGTH}
              accessibilityState={{ busy: Boolean(loading), disabled: Boolean(loading) || code.length !== CODE_LENGTH }}
              style={styles.submit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,14,10,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    ...premium.shadowSoft,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: ui.border,
    marginBottom: spacing.md,
  },
  close: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePressed: { backgroundColor: ui.surfaceMuted },
  iconWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: ui.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: spacing.lg,
    lineHeight: 19,
  },
  subtitleGap: { height: spacing.lg },
  input: {
    fontFamily: fonts.displaySemi,
    fontSize: 32,
    letterSpacing: 12,
    color: colors.forest,
    backgroundColor: colors.soft,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.green,
    paddingVertical: 16,
    marginBottom: spacing.sm,
  },
  submit: { marginTop: spacing.xs },
});
