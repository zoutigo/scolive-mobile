import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

// ── ModalFrame ────────────────────────────────────────────────────────────────

export function ModalFrame(props: {
  visible: boolean;
  title: string;
  eyebrow: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  testID: string;
  /**
   * Ref vers le ScrollView interne : à passer quand le formulaire utilise
   * `useScrollToFirstError` pour ramener le premier champ en erreur à
   * l'écran au submit invalide (voir skill improve-mobile-form, section
   * "Focus / scroll vers le premier champ en erreur").
   */
  scrollRef?: React.RefObject<ScrollView | null>;
}) {
  const { height: windowHeight } = useWindowDimensions();

  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="slide"
      onRequestClose={props.onClose}
    >
      <View style={styles.sheetOverlay}>
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={props.onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetKeyboard}
        >
          <View style={styles.sheetCard} testID={props.testID}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeaderRow}>
                <View style={styles.sheetHeaderText}>
                  <Text style={styles.sheetEyebrow}>{props.eyebrow}</Text>
                  <Text style={styles.sheetTitle} numberOfLines={2}>
                    {props.title}
                  </Text>
                  {props.subtitle ? (
                    <Text style={styles.sheetSubtitle} numberOfLines={2}>
                      {props.subtitle}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.sheetClose}
                  onPress={props.onClose}
                  testID={`${props.testID}-close`}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color="rgba(255,255,255,0.9)"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              ref={props.scrollRef}
              style={[
                styles.sheetScrollArea,
                { maxHeight: windowHeight * 0.55 },
              ]}
              contentContainerStyle={styles.sheetBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {props.children}
            </ScrollView>
            <View style={styles.sheetFooter}>{props.footer}</View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ── CompactSelectField ────────────────────────────────────────────────────────

export function CompactSelectField(props: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; meta?: string }>;
  placeholder: string;
  onChange: (value: string) => void;
  testID: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected =
    props.options.find((option) => option.value === props.value) ?? null;

  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{props.label}</Text>
      <TouchableOpacity
        style={[
          styles.compactSelectTrigger,
          props.error ? styles.compactSelectTriggerError : null,
        ]}
        onPress={() => setOpen(true)}
        testID={props.testID}
      >
        <View style={styles.compactSelectTextWrap}>
          <Text style={styles.compactSelectValue} numberOfLines={1}>
            {selected?.label ?? props.placeholder}
          </Text>
          {selected?.meta ? (
            <Text style={styles.compactSelectMeta} numberOfLines={1}>
              {selected.meta}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {props.error ? (
        <Text style={styles.formError} testID={`${props.testID}-error`}>
          {props.error}
        </Text>
      ) : null}
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.selectOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
          testID={`${props.testID}-overlay`}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(event) => event.stopPropagation()}
            style={styles.selectSheet}
            testID={`${props.testID}-sheet`}
          >
            <Text style={styles.selectSheetTitle}>{props.label}</Text>
            <ScrollView
              contentContainerStyle={styles.selectSheetOptions}
              showsVerticalScrollIndicator={false}
            >
              {props.options.map((option) => {
                const active = option.value === props.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.selectOptionRow,
                      active && styles.selectOptionRowActive,
                    ]}
                    onPress={() => {
                      props.onChange(option.value);
                      setOpen(false);
                    }}
                    testID={`${props.testID}-option-${option.value}`}
                  >
                    <View style={styles.selectOptionTextWrap}>
                      <Text
                        style={[
                          styles.selectOptionLabel,
                          active && styles.selectOptionLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {option.meta ? (
                        <Text
                          style={[
                            styles.selectOptionMeta,
                            active && styles.selectOptionMetaActive,
                          ]}
                        >
                          {option.meta}
                        </Text>
                      ) : null}
                    </View>
                    {active ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.warmAccent}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ── TextFormField ─────────────────────────────────────────────────────────────

export type TextFormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  error?: string;
  testID: string;
  keyboardType?: "default" | "numeric" | "email-address";
  autoCapitalize?: "none" | "sentences";
  secureTextEntry?: boolean;
};

export const TextFormField = React.forwardRef<TextInput, TextFormFieldProps>(
  function TextFormField(props, ref) {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.formField}>
        <Text style={styles.formLabel}>{props.label}</Text>
        <TextInput
          ref={ref}
          value={props.value}
          onChangeText={props.onChangeText}
          onBlur={() => {
            setFocused(false);
            props.onBlur();
          }}
          onFocus={() => setFocused(true)}
          placeholder={props.placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={props.keyboardType}
          autoCapitalize={props.autoCapitalize}
          secureTextEntry={props.secureTextEntry}
          style={[
            styles.formInput,
            focused && styles.formInputFocused,
            props.error ? styles.formInputError : null,
          ]}
          testID={props.testID}
        />
        {props.error ? (
          <Text style={styles.formError} testID={`${props.testID}-error`}>
            {props.error}
          </Text>
        ) : null}
      </View>
    );
  },
);

// ── FormActions ───────────────────────────────────────────────────────────────

export function FormActions(props: {
  submitLabel: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  testIDPrefix: string;
}) {
  return (
    <View style={styles.formActions}>
      <TouchableOpacity
        style={styles.secondaryAction}
        onPress={props.onCancel}
        testID={`${props.testIDPrefix}-cancel`}
      >
        <Text style={styles.secondaryActionLabel}>Annuler</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.primaryAction,
          (props.isSubmitting || props.submitDisabled) &&
            styles.primaryActionDisabled,
        ]}
        disabled={props.isSubmitting || props.submitDisabled}
        onPress={props.onSubmit}
        testID={`${props.testIDPrefix}-submit`}
      >
        <Text style={styles.primaryActionLabel}>
          {props.isSubmitting ? "Enregistrement..." : props.submitLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

export const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 20, 34, 0.28)",
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheetKeyboard: {},
  sheetCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  sheetHeader: {
    backgroundColor: colors.primary,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  sheetHeaderText: {
    flex: 1,
    gap: 3,
  },
  sheetEyebrow: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sheetTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
  },
  sheetSubtitle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  sheetScrollArea: {},
  sheetBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 14,
  },
  sheetFooter: {
    backgroundColor: colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 20,
    flexDirection: "row",
    gap: 10,
  },
  formField: {
    gap: 8,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
  },
  formInputFocused: {
    borderColor: colors.primary,
  },
  formInputError: {
    borderColor: "#B84A3B",
  },
  formError: {
    color: "#B84A3B",
    fontSize: 12,
    lineHeight: 16,
  },
  compactSelectTrigger: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  compactSelectTriggerError: {
    borderColor: "#B84A3B",
  },
  compactSelectTextWrap: {
    flex: 1,
    gap: 3,
  },
  compactSelectValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  compactSelectMeta: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  selectOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 20, 34, 0.28)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  selectSheet: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxHeight: "72%",
  },
  selectSheetTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  selectSheetOptions: {
    gap: 8,
  },
  selectOptionRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  selectOptionRowActive: {
    borderColor: colors.primary,
    backgroundColor: "#F1F7FC",
  },
  selectOptionTextWrap: {
    flex: 1,
    gap: 2,
  },
  selectOptionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  selectOptionLabelActive: {
    color: colors.primary,
  },
  selectOptionMeta: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  selectOptionMetaActive: {
    color: colors.primary,
  },
  formActions: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  secondaryActionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  primaryAction: {
    flex: 1.2,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  primaryActionDisabled: {
    opacity: 0.5,
  },
  primaryActionLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
