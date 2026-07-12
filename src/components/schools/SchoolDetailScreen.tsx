import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { schoolsApi } from "../../api/schools.api";
import { ConfirmDialog } from "../ConfirmDialog";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { useTranslation } from "../../i18n/useTranslation";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  SectionCard,
} from "../timetable/TimetableCommon";
import { CyclePill, LanguagePill, StatTile } from "./SchoolBadges";
import {
  EMPTY_SCHOOL_ADMIN_ENTRY,
  SchoolAdminEntryForm,
  schoolAdminEntryToPayload,
  validateSchoolAdminEntry,
  type SchoolAdminEntryErrors,
  type SchoolAdminEntryValue,
} from "./SchoolAdminEntryForm";
import { colors } from "../../theme";
import { extractApiError } from "../../utils/api-error";
import type { SchoolAdminRow, SchoolDetails } from "../../types/schools.types";
import { moduleBack } from "../../utils/moduleBack";

function formatAcademicDate(iso: string | null | undefined, locale: string) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SchoolDetailScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const params = useLocalSearchParams<{ schoolId?: string }>();
  const schoolId = typeof params.schoolId === "string" ? params.schoolId : "";

  const [details, setDetails] = useState<SchoolDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittingAddAdmin, setIsSubmittingAddAdmin] = useState(false);
  const [resendingAdminId, setResendingAdminId] = useState<string | null>(null);
  const [removeAdminTarget, setRemoveAdminTarget] =
    useState<SchoolAdminRow | null>(null);
  const [isRemovingAdmin, setIsRemovingAdmin] = useState(false);

  const [newAdmin, setNewAdmin] = useState<SchoolAdminEntryValue>(
    EMPTY_SCHOOL_ADMIN_ENTRY,
  );
  const [newAdminErrors, setNewAdminErrors] = useState<SchoolAdminEntryErrors>(
    {},
  );

  const load = useCallback(async () => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }
    setErrorMessage(null);
    try {
      const data = await schoolsApi.getSchoolDetails(schoolId);
      setDetails(data);
    } catch (error) {
      setErrorMessage(extractApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitAddAdmin = useCallback(async () => {
    const validationErrors = validateSchoolAdminEntry(newAdmin, t);
    if (Object.keys(validationErrors).length > 0) {
      setNewAdminErrors(validationErrors);
      return;
    }
    const payload = schoolAdminEntryToPayload(newAdmin);
    if (!payload) return;

    setNewAdminErrors({});
    setIsSubmittingAddAdmin(true);
    try {
      const result = await schoolsApi.addSchoolAdmin(schoolId, payload);
      showSuccess({
        title: t("schoolsAdmin.detail.addAdminSuccessTitle"),
        message: result.activationCode
          ? `${t("schoolsAdmin.detail.addAdminSuccessMessage")}\n${t(
              "schoolsAdmin.detail.activationCodeBanner",
            )}: ${result.activationCode}`
          : t("schoolsAdmin.detail.addAdminSuccessMessage"),
      });
      setNewAdmin(EMPTY_SCHOOL_ADMIN_ENTRY);
      await load();
    } catch (error) {
      showError({
        title: t("schoolsAdmin.detail.addAdminFailedTitle"),
        message: extractApiError(error),
      });
    } finally {
      setIsSubmittingAddAdmin(false);
    }
  }, [newAdmin, schoolId, showSuccess, showError, t, load]);

  const resendInvite = useCallback(
    async (adminUserId: string) => {
      setResendingAdminId(adminUserId);
      try {
        await schoolsApi.resendSchoolAdminInvite(schoolId, adminUserId);
        showSuccess({
          title: t("schoolsAdmin.detail.resendInviteSuccessTitle"),
          message: t("schoolsAdmin.detail.resendInviteSuccessMessage"),
        });
      } catch (error) {
        showError({
          title: t("schoolsAdmin.detail.resendInviteFailedTitle"),
          message: extractApiError(error),
        });
      } finally {
        setResendingAdminId(null);
      }
    },
    [schoolId, showSuccess, showError, t],
  );

  const confirmRemoveAdmin = useCallback(async () => {
    if (!removeAdminTarget) return;
    setIsRemovingAdmin(true);
    try {
      await schoolsApi.removeSchoolAdmin(schoolId, removeAdminTarget.id);
      showSuccess({
        title: t("schoolsAdmin.detail.removeAdminSuccessTitle"),
        message: t("schoolsAdmin.detail.removeAdminSuccessMessage"),
      });
      setRemoveAdminTarget(null);
      await load();
    } catch (error) {
      showError({
        title: t("schoolsAdmin.detail.removeAdminFailedTitle"),
        message: extractApiError(error),
      });
    } finally {
      setIsRemovingAdmin(false);
    }
  }, [removeAdminTarget, schoolId, showSuccess, showError, t, load]);

  const academicStart = formatAcademicDate(
    details?.academicYear?.startsAt,
    locale,
  );
  const academicEnd = formatAcademicDate(details?.academicYear?.endsAt, locale);

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={details?.name ?? t("schoolsAdmin.detail.headerSubtitlePrefix")}
        subtitle={details?.slug ?? null}
        onBack={() => moduleBack(router)}
        testID="school-detail-header"
        titleUppercase={false}
        topInset={insets.top}
      />

      {isLoading ? (
        <View style={styles.stateWrap}>
          <LoadingBlock label={t("schoolsAdmin.detail.loading")} />
        </View>
      ) : errorMessage && !details ? (
        <View style={styles.stateWrap}>
          <ErrorBanner
            message={errorMessage}
            testID="school-detail-error-banner"
          />
        </View>
      ) : !details ? (
        <View style={styles.stateWrap}>
          <EmptyState
            icon="business-outline"
            title={t("schoolsAdmin.detail.notFoundTitle")}
            message={t("schoolsAdmin.detail.notFoundMessage")}
          />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardArea}
        >
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            testID="school-detail-scroll"
          >
            {errorMessage ? (
              <ErrorBanner
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
                testID="school-detail-error-banner"
              />
            ) : null}

            <SectionCard
              title={t("schoolsAdmin.detail.sections.identity")}
              testID="school-detail-identity"
            >
              <View style={styles.pillsRow}>
                <CyclePill cycle={details.cycle} testID="school-detail-cycle" />
                <LanguagePill
                  languageSystem={details.languageSystem}
                  testID="school-detail-language"
                />
              </View>
              <View style={styles.infoRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.infoText}>
                  {[details.city, details.region, details.country]
                    .filter(Boolean)
                    .join(", ") || t("schoolsAdmin.detail.noLocation")}
                </Text>
              </View>
            </SectionCard>

            <SectionCard
              title={t("schoolsAdmin.detail.sections.academic")}
              testID="school-detail-academic"
            >
              {details.academicYear ? (
                <View style={styles.academicRow}>
                  <Ionicons name="calendar" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.academicLabel}>
                      {details.academicYear.label}
                    </Text>
                    {academicStart || academicEnd ? (
                      <Text style={styles.academicDates}>
                        {academicStart ?? "—"} → {academicEnd ?? "—"}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : (
                <Text style={styles.mutedText}>
                  {t("schoolsAdmin.detail.noAcademicYear")}
                </Text>
              )}
            </SectionCard>

            <SectionCard
              title={t("schoolsAdmin.detail.sections.users")}
              testID="school-detail-users"
            >
              <View style={styles.statsGrid}>
                <StatTile
                  icon="briefcase-outline"
                  label={t("schoolsAdmin.detail.roleStaff")}
                  value={details.roleBreakdown.staff}
                  tone="primary"
                  testID="school-detail-stat-staff"
                />
                <StatTile
                  icon="school-outline"
                  label={t("schoolsAdmin.detail.roleTeachers")}
                  value={details.roleBreakdown.teachers}
                  tone="teal"
                  testID="school-detail-stat-teachers"
                />
                <StatTile
                  icon="people-outline"
                  label={t("schoolsAdmin.detail.roleParents")}
                  value={details.roleBreakdown.parents}
                  tone="warm"
                  testID="school-detail-stat-parents"
                />
                <StatTile
                  icon="body-outline"
                  label={t("schoolsAdmin.detail.roleStudents")}
                  value={details.roleBreakdown.students}
                  tone="teal"
                  testID="school-detail-stat-students"
                />
              </View>
            </SectionCard>

            <SectionCard
              title={t("schoolsAdmin.detail.sections.stats")}
              testID="school-detail-stats"
            >
              <View style={styles.statsGrid}>
                <StatTile
                  icon="people-circle-outline"
                  label={t("schoolsAdmin.detail.statsUsersTotal")}
                  value={details.stats.usersCount}
                  tone="primary"
                  testID="school-detail-stat-users-total"
                />
                <StatTile
                  icon="grid-outline"
                  label={t("schoolsAdmin.detail.statsClasses")}
                  value={details.stats.classesCount}
                  tone="warm"
                  testID="school-detail-stat-classes"
                />
                <StatTile
                  icon="body-outline"
                  label={t("schoolsAdmin.detail.statsStudentsTotal")}
                  value={details.stats.studentsCount}
                  tone="teal"
                  testID="school-detail-stat-students-total"
                />
                <StatTile
                  icon="document-text-outline"
                  label={t("schoolsAdmin.detail.statsGrades")}
                  value={details.stats.gradesCount}
                  tone="primary"
                  testID="school-detail-stat-grades"
                />
              </View>
            </SectionCard>

            <SectionCard
              title={t("schoolsAdmin.detail.sections.admins")}
              testID="school-detail-admins"
            >
              {details.schoolAdmins.length === 0 ? (
                <Text style={styles.mutedText}>
                  {t("schoolsAdmin.detail.adminEmpty")}
                </Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {details.schoolAdmins.map((admin) => (
                    <View
                      key={admin.id}
                      style={styles.adminRow}
                      testID={`school-detail-admin-${admin.id}`}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.adminName}>
                          {admin.firstName} {admin.lastName}
                        </Text>
                        <Text style={styles.adminEmail}>{admin.email}</Text>
                      </View>
                      <View
                        style={[
                          styles.adminBadge,
                          admin.canResendInvite
                            ? styles.adminBadgePending
                            : styles.adminBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.adminBadgeText,
                            admin.canResendInvite
                              ? styles.adminBadgeTextPending
                              : styles.adminBadgeTextActive,
                          ]}
                        >
                          {admin.canResendInvite
                            ? t("schoolsAdmin.detail.pendingBadge")
                            : t("schoolsAdmin.detail.activeBadge")}
                        </Text>
                      </View>
                      {admin.canResendInvite ? (
                        <TouchableOpacity
                          style={styles.resendBtn}
                          onPress={() => resendInvite(admin.id)}
                          disabled={resendingAdminId === admin.id}
                          testID={`school-detail-resend-${admin.id}`}
                        >
                          <Ionicons
                            name="mail-outline"
                            size={14}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity
                        style={styles.resendBtn}
                        onPress={() => setRemoveAdminTarget(admin)}
                        disabled={details.schoolAdmins.length <= 1}
                        testID={`school-detail-remove-admin-${admin.id}`}
                      >
                        <Ionicons
                          name="person-remove-outline"
                          size={14}
                          color={
                            details.schoolAdmins.length <= 1
                              ? colors.textSecondary
                              : colors.notification
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {details.schoolAdmins.length <= 1 ? (
                    <Text style={styles.mutedText}>
                      {t("schoolsAdmin.detail.removeAdminLastAdminHint")}
                    </Text>
                  ) : null}
                </View>
              )}

              <View
                style={styles.addAdminForm}
                testID="school-detail-add-admin-form"
              >
                <SchoolAdminEntryForm
                  value={newAdmin}
                  onChange={setNewAdmin}
                  errors={newAdminErrors}
                  title={t("schoolsAdmin.detail.addAdminTitle")}
                  testIDPrefix="school-detail-add-admin"
                  t={t}
                />
                <TouchableOpacity
                  style={[
                    styles.addAdminSubmit,
                    isSubmittingAddAdmin && styles.addAdminSubmitDisabled,
                  ]}
                  disabled={isSubmittingAddAdmin}
                  onPress={submitAddAdmin}
                  testID="school-detail-add-admin-submit"
                >
                  <Text style={styles.addAdminSubmitLabel}>
                    {isSubmittingAddAdmin
                      ? t("schoolsAdmin.detail.addAdminSubmitting")
                      : t("schoolsAdmin.detail.addAdminSubmit")}
                  </Text>
                </TouchableOpacity>
              </View>
            </SectionCard>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <ConfirmDialog
        visible={removeAdminTarget != null}
        title={t("schoolsAdmin.detail.confirmRemoveAdminTitle")}
        message={
          removeAdminTarget
            ? `${removeAdminTarget.firstName} ${removeAdminTarget.lastName}\n${t(
                "schoolsAdmin.detail.confirmRemoveAdminMessage",
              )}`
            : ""
        }
        variant="danger"
        confirmLabel={t("schoolsAdmin.detail.confirmRemoveAdminConfirm")}
        cancelLabel={t("schoolsAdmin.detail.confirmRemoveAdminCancel")}
        onConfirm={() => {
          void confirmRemoveAdmin();
        }}
        onCancel={() => {
          if (!isRemovingAdmin) setRemoveAdminTarget(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  keyboardArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  pillsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  academicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  academicLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  academicDates: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mutedText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  adminRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  adminName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  adminEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  adminBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  adminBadgeActive: {
    backgroundColor: "rgba(36,124,114,0.14)",
  },
  adminBadgePending: {
    backgroundColor: "rgba(216,155,91,0.20)",
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  adminBadgeTextActive: {
    color: colors.accentTealDark,
  },
  adminBadgeTextPending: {
    color: "#8A5A24",
  },
  resendBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  addAdminForm: {
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
  },
  addAdminTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
  },
  addAdminSubmit: {
    alignSelf: "flex-start",
    borderRadius: 6,
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  addAdminSubmitDisabled: {
    opacity: 0.5,
  },
  addAdminSubmitLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
});
