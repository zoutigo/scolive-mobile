import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { useTranslation } from "../../i18n/useTranslation";
import { financeApi } from "../../api/finance.api";
import { familyApi, type AdminStudentRow } from "../../api/family.api";
import { teachersApi } from "../../api/teachers.api";
import { extractApiError } from "../../utils/api-error";
import { moduleBack } from "../../utils/moduleBack";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { InlineSelectDropDown } from "../InlineSelectDropDown";
import { EmptyState } from "../timetable/TimetableCommon";
import type { TeacherSchoolYearOption } from "../../types/teachers.types";
import type { StudentFinanceSummary } from "../../types/finance-admin.types";

function roleAllowsFinance(role: string | null | undefined) {
  return (
    role === "SCHOOL_ADMIN" ||
    role === "SCHOOL_MANAGER" ||
    role === "SCHOOL_ACCOUNTANT" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

export function FinancePaymentsAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { schoolSlug, user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const effectiveRole = user?.activeRole ?? null;
  const canAccessModule = roleAllowsFinance(effectiveRole);

  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [selectedStudent, setSelectedStudent] =
    useState<AdminStudentRow | null>(null);
  const [schoolYears, setSchoolYears] = useState<TeacherSchoolYearOption[]>([]);
  const [targetSchoolYearId, setTargetSchoolYearId] = useState("");
  const [summary, setSummary] = useState<StudentFinanceSummary | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (schoolSlug)
      void teachersApi.listSchoolYears(schoolSlug).then(setSchoolYears);
  }, [schoolSlug]);

  useEffect(() => {
    if (schoolSlug && selectedStudent && targetSchoolYearId) void loadSummary();
    else setSummary(null);
  }, [schoolSlug, selectedStudent, targetSchoolYearId]);

  async function onSearch() {
    if (!schoolSlug) return;
    try {
      const page = await familyApi.listAdminStudents(schoolSlug, { search });
      setStudents(page.students);
    } catch (error) {
      showError({
        title: t("financeAdmin.payments.errors.search"),
        message: extractApiError(error),
      });
    }
  }

  async function loadSummary() {
    if (!schoolSlug || !selectedStudent || !targetSchoolYearId) return;
    setSummary(null);
    try {
      const result = await financeApi.getStudentFinanceSummary(
        schoolSlug,
        selectedStudent.id,
        targetSchoolYearId,
      );
      setSummary(result);
    } catch (error) {
      showError({
        title: t("financeAdmin.payments.errors.summary"),
        message: extractApiError(error),
      });
    }
  }

  async function onSubmitPayment() {
    if (!schoolSlug || !selectedStudent || !targetSchoolYearId) return;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;
    setSubmitting(true);
    try {
      const result = await financeApi.recordDirectPayment(schoolSlug, {
        studentId: selectedStudent.id,
        schoolYearId: targetSchoolYearId,
        amount: numericAmount,
        paidAt: new Date().toISOString(),
      });
      showSuccess({
        title: result.reinscriptionConfirmed
          ? t("financeAdmin.payments.success.paidAndReinscribed")
          : t("financeAdmin.payments.success.paid"),
        message: "",
      });
      setAmount("");
      await loadSummary();
    } catch (error) {
      showError({
        title: t("financeAdmin.payments.errors.save"),
        message: extractApiError(error),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const yearOptions = schoolYears.map((y) => ({ value: y.id, label: y.label }));

  if (!canAccessModule) {
    return (
      <View style={styles.screen}>
        <ModuleHeader
          title={t("financeAdmin.payments.title")}
          onBack={() => moduleBack(router)}
          topInset={insets.top}
          testID="finance-payments-header"
        />
        <View style={styles.lockedWrap}>
          <EmptyState
            icon="cash-outline"
            title={t("financeAdmin.lockedTitle")}
            message={t("financeAdmin.lockedMessage")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ModuleHeader
        title={t("financeAdmin.payments.title")}
        onBack={() => moduleBack(router)}
        topInset={insets.top}
        testID="finance-payments-header"
        backTestID="finance-payments-back-btn"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder={t("financeAdmin.payments.search.placeholder")}
              testID="finance-payments-search-input"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={onSearch}
              testID="finance-payments-search-button"
            >
              <Text style={styles.searchButtonText}>
                {t("financeAdmin.payments.search.button")}
              </Text>
            </TouchableOpacity>
          </View>

          {students.map((student) => (
            <TouchableOpacity
              key={student.id}
              style={[
                styles.studentRow,
                selectedStudent?.id === student.id && styles.studentRowActive,
              ]}
              onPress={() => setSelectedStudent(student)}
              testID={`finance-payments-student-${student.id}`}
            >
              <Text style={styles.studentRowText}>
                {student.lastName} {student.firstName}
              </Text>
            </TouchableOpacity>
          ))}

          {selectedStudent ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                {t("financeAdmin.payments.targetYear")}
              </Text>
              <InlineSelectDropDown
                options={yearOptions}
                value={targetSchoolYearId}
                onChange={setTargetSchoolYearId}
                testID="finance-payments-target-year"
              />
            </View>
          ) : null}

          {summary ? (
            <View style={styles.summaryCard} testID="finance-payments-summary">
              <Text style={styles.summaryLine}>
                {t("financeAdmin.payments.summary.totalPaid")}:{" "}
                {summary.totalPaid.toLocaleString()}
              </Text>
              <Text style={styles.summaryLine}>
                {t("financeAdmin.payments.summary.threshold")}:{" "}
                {summary.thresholdAmount.toLocaleString()}
              </Text>
              <Text style={styles.summaryEligibility}>
                {summary.reinscriptionEligible
                  ? t("financeAdmin.payments.summary.eligible")
                  : t("financeAdmin.payments.summary.notEligible")}
              </Text>

              <Text style={styles.fieldLabel}>
                {t("financeAdmin.payments.form.amount")}
              </Text>
              <TextInput
                style={styles.formInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                testID="finance-payments-amount-input"
              />
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  submitting && styles.submitButtonDisabled,
                ]}
                disabled={submitting || !amount}
                onPress={onSubmitPayment}
                testID="finance-payments-submit"
              >
                <Text style={styles.submitButtonText}>
                  {t("financeAdmin.payments.form.submit")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  lockedWrap: { flex: 1, padding: 16, justifyContent: "center" },
  keyboardArea: { flex: 1 },
  content: { padding: 16, gap: 12 },
  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  searchButton: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchButtonText: { color: colors.white, fontSize: 13, fontWeight: "700" },
  studentRow: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  studentRowActive: { borderColor: colors.primary, backgroundColor: "#EAF4FF" },
  studentRowText: { fontSize: 14, color: colors.textPrimary },
  field: { gap: 8, marginTop: 8 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
  },
  summaryCard: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
  },
  summaryLine: { fontSize: 13, color: colors.textSecondary },
  summaryEligibility: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  submitButton: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 14, fontWeight: "700", color: colors.white },
});
