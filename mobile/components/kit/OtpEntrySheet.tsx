import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyRound, X } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { colors, fonts, premium, spacing } from '@/constants/theme';
import { textInputDefaults } from '@/components/ui/textInputDefaults';

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
  const [code, setCode] = useState('');
  const shake = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setCode('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !errorTrigger) return;
    setCode('');
    triggerShake();
  }, [errorTrigger, visible]);

  function triggerShake() {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  function submit() {
    if (code.length !== 6) {
      triggerShake();
      return;
    }
    onSubmit(code);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Pressable style={styles.close} onPress={onClose} hitSlop={8}>
            <X size={20} color={colors.muted} />
          </Pressable>

          <View style={styles.iconWrap}>
            <KeyRound size={24} color={colors.white} />
          </View>
          <Text style={styles.title}>{title}</Text>

          <Animated.View style={{ transform: [{ translateX: shake }] }}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              {...textInputDefaults}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor={colors.muted}
              textAlign="center"
            />
          </Animated.View>

          <Button
            title={loading ? 'Verifying…' : 'Verify code'}
            onPress={submit}
            disabled={loading || code.length !== 6}
            style={styles.submit}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 12,
    paddingTop: spacing.sm,
    ...premium.shadowSoft,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  close: { position: 'absolute', top: spacing.md, right: spacing.md, zIndex: 1 },
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
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  input: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 12,
    color: colors.forest,
    backgroundColor: colors.soft,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.green,
    paddingVertical: 16,
    marginBottom: spacing.sm,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  submit: { marginTop: spacing.xs },
});
