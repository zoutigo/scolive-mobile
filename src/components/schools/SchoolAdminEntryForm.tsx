import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SecureTextField } from "../SecureTextField";
import { normalizePhoneInput } from "../account/account.schemas";
import { colors } from "../../theme";
import type { AddSchoolAdminPayload } from "../../types/schools.types";
import type { TranslateFn } from "../../i18n/useTranslation";

export type SchoolAdminEntryMode = "email" | "phone";

export type SchoolAdminEntryValue = {
  mode: SchoolAdminEntryMode;
  email: string;
  phone: string;
  pin: string;
};

export const EMPTY_SCHOOL_ADMIN_ENTRY: SchoolAdminEntryValue = {
  mode: "email",
  email: "",
  phone: "",
  pin: "",
};

export type SchoolAdminEntryErrors = {
  email?: string;
  phone?: string;
  pin?: string;
};

export function schoolAdminEntryToPayload(
  entry: SchoolAdminEntryValue,
): AddSchoolAdminPayload | null {
  if (entry.mode === "email") {
    const email = entry.email.trim();
    return email ? { email } : null;
  }
  const phone = entry.phone.trim();
  const pin = entry.pin.trim();
  if (!phone || !pin) return null;
  return { phone, pin };
}

export function validateSchoolAdminEntry(
  entry: SchoolAdminEntryValue,
  t: TranslateFn,
): SchoolAdminEntryErrors {
  const errors: SchoolAdminEntryErrors = {};
  if (entry.mode === "email") {
    const email = entry.email.trim();
    if (!email) {
      errors.email = t("schoolsAdmin.form.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t("schoolsAdmin.form.errors.emailInvalid");
    }
  } else {
    if (!entry.phone.trim()) {
      errors.phone = t("schoolsAdmin.form.errors.phoneRequired");
    }
    if (!/^\d{6}$/.test(entry.pin.trim())) {
      errors.pin = t("schoolsAdmin.form.errors.pinInvalid");
    }
  }
  return errors;
}

interface SchoolAdminEntryFormProps {
  value: SchoolAdminEntryValue;
  onChange: (value: SchoolAdminEntryValue) => void;
  errors?: SchoolAdminEntryErrors;
  title: string;
  onRemove?: () => void;
  testIDPrefix: string;
  t: TranslateFn;
}

export function SchoolAdminEntryForm({
  value,
  onChange,
  errors,
  title,
  onRemove,
  testIDPrefix,
  t,
}: SchoolAdminEntryFormProps) {
  return (
    <View style={styles.container} testID={testIDPrefix}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {onRemove ? (
          <TouchableOpacity
            onPress={onRemove}
            testID={`${testIDPrefix}-remove`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.notification}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[
            styles.modeChip,
            value.mode === "email" && styles.modeChipActive,
          ]}
          onPress={() => onChange({ ...value, mode: "email" })}
          testID={`${testIDPrefix}-mode-email`}
        >
          <Text
            style={[
              styles.modeChipLabel,
              value.mode === "email" && styles.modeChipLabelActive,
            ]}
          >
            {t("schoolsAdmin.form.adminModeEmail")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeChip,
            value.mode === "phone" && styles.modeChipActive,
          ]}
          onPress={() => onChange({ ...value, mode: "phone" })}
          testID={`${testIDPrefix}-mode-phone`}
        >
          <Text
            style={[
              styles.modeChipLabel,
              value.mode === "phone" && styles.modeChipLabelActive,
            ]}
          >
            {t("schoolsAdmin.form.adminModePhone")}
          </Text>
        </TouchableOpacity>
      </View>

      {value.mode === "email" ? (
        <View style={styles.field}>
          <Text style={styles.label}>{t("schoolsAdmin.form.adminEmail")}</Text>
          <TextInput
            value={value.email}
            onChangeText={(next) => onChange({ ...value, email: next })}
            placeholder={t("schoolsAdmin.form.adminEmailPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, errors?.email && styles.inputError]}
            testID={`${testIDPrefix}-email`}
          />
          {errors?.email ? (
            <Text style={styles.error} testID={`${testIDPrefix}-email-error`}>
              {errors.email}
            </Text>
          ) : null}
        </View>
      ) : (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("schoolsAdmin.form.adminPhone")}
            </Text>
            <TextInput
              value={value.phone}
              onChangeText={(next) =>
                onChange({ ...value, phone: normalizePhoneInput(next) })
              }
              placeholder={t("schoolsAdmin.form.adminPhonePlaceholder")}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              style={[styles.input, errors?.phone && styles.inputError]}
              testID={`${testIDPrefix}-phone`}
            />
            {errors?.phone ? (
              <Text style={styles.error} testID={`${testIDPrefix}-phone-error`}>
                {errors.phone}
              </Text>
            ) : null}
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t("schoolsAdmin.form.adminPin")}</Text>
            <SecureTextField
              value={value.pin}
              onChangeText={(next) =>
                onChange({ ...value, pin: next.replace(/\D/g, "").slice(0, 6) })
              }
              placeholder="123456"
              hasError={!!errors?.pin}
              testID={`${testIDPrefix}-pin`}
              variant="pin"
              keyboardType="numeric"
              containerStyle={{ borderRadius: 6 }}
            />
            {errors?.pin ? (
              <Text style={styles.error} testID={`${testIDPrefix}-pin-error`}>
                {errors.pin}
              </Text>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#E0D0BA",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#E0D0BA",
    alignItems: "center",
  },
  modeChipActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(8,70,125,0.08)",
  },
  modeChipLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  modeChipLabelActive: {
    color: colors.primary,
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  input: {
    height: 44,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#E0D0BA",
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.notification,
  },
  error: {
    fontSize: 12,
    color: colors.notification,
  },
});
