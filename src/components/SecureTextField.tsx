import { useState } from "react";
import type { ComponentProps } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

type NativeTextInputProps = ComponentProps<typeof TextInput>;

export interface SecureTextFieldProps extends NativeTextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  variant?: "pin" | "password";
  visibilityToggleTestID?: string;
}

export function SecureTextField({
  containerStyle,
  inputStyle,
  variant = "password",
  visibilityToggleTestID,
  testID,
  ...props
}: SecureTextFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const toggleTestID = visibilityToggleTestID ?? `${testID}-toggle-visibility`;
  const accessibilityLabel = isVisible
    ? variant === "pin"
      ? "Masquer le code PIN"
      : "Masquer le mot de passe"
    : variant === "pin"
      ? "Afficher le code PIN"
      : "Afficher le mot de passe";

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        {...props}
        testID={testID}
        secureTextEntry={!isVisible}
        style={[styles.input, inputStyle]}
      />
      <Pressable
        testID={toggleTestID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => setIsVisible((current) => !current)}
        style={({ pressed }) => [
          styles.toggleButton,
          pressed && styles.toggleButtonPressed,
        ]}
      >
        <Ionicons
          name={isVisible ? "eye-outline" : "eye-off-outline"}
          size={20}
          color={isVisible ? colors.primary : colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2D6CA",
    borderRadius: 14,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    minHeight: 54,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: "transparent",
  },
  toggleButton: {
    width: 48,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#EDE2D6",
    backgroundColor: "#FFF8F0",
  },
  toggleButtonPressed: {
    opacity: 0.75,
  },
});
