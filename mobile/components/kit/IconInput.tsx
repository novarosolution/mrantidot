import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/constants/theme';

export function IconInput({
  label,
  leftIcon,
  secure,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & {
  label: string;
  leftIcon?: React.ReactNode;
  secure?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isSecure = secure && !show;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, focused && styles.rowFocused]}>
        {leftIcon ? <View style={styles.left}>{leftIcon}</View> : null}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.muted}
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {secure ? (
          <Pressable onPress={() => setShow((s) => !s)} style={styles.eye}>
            {show ? <EyeOff size={18} color={colors.muted} /> : <Eye size={18} color={colors.muted} />}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
  },
  rowFocused: {
    borderColor: colors.secondaryDark,
    backgroundColor: colors.white,
  },
  left: { marginRight: 10 },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  eye: { padding: 4 },
});
