import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { testsAdminApi } from "../../api/tests-admin.api";
import type { AdminCaseDetail } from "../../types/tests-admin.types";

type Props = {
  testCaseId: string;
  onClose: () => void;
};

export function TestCaseContentSheet({ testCaseId, onClose }: Props) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<AdminCaseDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await testsAdminApi.getCase(testCaseId);
        if (!cancelled) setDetail(response);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : t("testsAdmin.common.errors.loadGeneric"),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [testCaseId]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet} testID="test-case-content-sheet">
          <Text style={styles.title}>
            {t("testsAdmin.executions.detail.caseContentTitle")}
          </Text>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : !detail ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content}>
              <Text style={styles.caseTitle}>{detail.title}</Text>
              {detail.module ? (
                <Text style={styles.metaPill}>{detail.module}</Text>
              ) : null}

              <Field
                label={t("testsAdmin.caseForm.objectiveLabel")}
                value={detail.objective}
                t={t}
              />
              <Field
                label={t("testsAdmin.caseForm.preconditionsLabel")}
                value={detail.preconditions}
                t={t}
              />
              <Field
                label={t("testsAdmin.caseForm.expectedResultLabel")}
                value={detail.expectedResult}
                t={t}
              />
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onClose}
            testID="test-case-content-close"
          >
            <Text style={styles.primaryButtonText}>
              {t("testsAdmin.common.close")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  t,
}: {
  label: string;
  value: string | null;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>
        {value?.trim() || t("tests.common.noValue")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", padding: 20 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.34)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 18,
    gap: 14,
    maxHeight: "80%",
  },
  title: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
  center: { paddingVertical: 24, alignItems: "center" },
  errorText: { fontSize: 14, color: colors.notification, textAlign: "center" },
  content: { gap: 12 },
  caseTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  metaPill: {
    fontSize: 12,
    color: colors.primary,
    backgroundColor: "#F4E9DE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  field: { gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  fieldValue: { fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  primaryButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});
