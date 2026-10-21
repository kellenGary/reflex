import { forwardRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, Text, TextInput, View, type TextInputProps, type TextStyle } from 'react-native';

const noOutline = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as unknown as TextStyle;

type FieldProps = TextInputProps & { label: string; secure?: boolean };

/** Labelled input with a visible focus state and, for passwords, a show/hide toggle. */
export const Field = forwardRef<ComponentRef<typeof TextInput>, FieldProps>(function Field({ label, secure, ...props }, ref) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      <View
        className={`h-12 flex-row items-center rounded-xl border bg-cream px-4 ${focused ? 'border-ink' : 'border-line'}`}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor="#B8B29B"
          secureTextEntry={secure && !shown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="h-full flex-1 text-base text-ink"
          style={noOutline}
          {...props}
        />
        {secure && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shown ? 'Hide password' : 'Show password'}
            onPress={() => setShown((v) => !v)}
            className="h-11 justify-center pl-3"
          >
            <Text className="text-sm text-muted">{shown ? 'Hide' : 'Show'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});
