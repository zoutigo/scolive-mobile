import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
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
import { curriculumsApi } from "../../api/curriculums.api";
import { extractApiError } from "../../utils/api-error";
import { moduleBack } from "../../utils/moduleBack";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { EmptyState, LoadingBlock } from "../timetable/TimetableCommon";
import { OnboardingTarget } from "../onboarding/OnboardingTarget";
import { PageHelpModal } from "../help/PageHelpModal";
import { useOnboardingTourTrigger } from "../../hooks/useOnboardingTourTrigger";
import { useOnboardingTourStore } from "../../store/onboarding-tour.store";
import {
  SCHOOL_SETTINGS_TOUR_ID,
  SCHOOL_SETTINGS_TOUR_STEPS,
  SCHOOL_SETTINGS_TOUR_TARGETS,
} from "./school-settings-tour.config";
import type { CurriculumAcademicLevel } from "../../types/curriculums.types";

type SettingsTab = "levels";

function roleAllowsSchoolSettings(role: string | null | undefined) {
  return (
    role === "SCHOOL_ADMIN" ||
    role === "SCHOOL_MANAGER" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

export function SchoolSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { schoolSlug, user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const effectiveRole = user?.activeRole ?? null;
  const canAccessModule = roleAllowsSchoolSettings(effectiveRole);

  const [tab, setTab] = useState<SettingsTab>("levels");
  const [levels, setLevels] = useState<CurriculumAcademicLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingLevelId, setTogglingLevelId] = useState<string | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);

  useOnboardingTourTrigger({
    tourId: SCHOOL_SETTINGS_TOUR_ID,
    role: "school",
    steps: SCHOOL_SETTINGS_TOUR_STEPS,
  });
  const advanceOnboardingTourTarget = useOnboardingTourStore(
    (state) => state.advanceIfTarget,
  );

  const load = useCallback(async () => {
    if (!schoolSlug || !canAccessModule) return;
    setIsLoading(true);
    try {
      const rows = await curriculumsApi.listAcademicLevels(schoolSlug);
      setLevels(rows);
      setOrderDrafts(
        Object.fromEntries(
          rows.map((row) => [
            row.id,
            row.order !== null && row.order !== undefined
              ? String(row.order)
              : "",
          ]),
        ),
      );
    } catch (error) {
      showError({
        title: t("schoolSettings.errors.load"),
        message: extractApiError(error),
      });
    } finally {
      setIsLoading(false);
    }
    // `t`/`showError` intentionally omitted: nouvelle référence à chaque
    // render, retriggerait cette callback inutilement.
  }, [schoolSlug, canAccessModule]);

  useEffect(() => {
    void load();
  }, [load]);

  const orderedLevels = useMemo(
    () =>
      [...levels].sort((a, b) => {
        if (a.order == null && b.order == null)
          return a.code.localeCompare(b.code);
        if (a.order == null) return 1;
        if (b.order == null) return -1;
        return a.order - b.order;
      }),
    [levels],
  );

  async function toggleActivation(level: CurriculumAcademicLevel) {
    if (!schoolSlug || level.isNational === false) return;
    const nextActivated = !level.isActivated;
    setTogglingLevelId(level.id);
    try {
      await curriculumsApi.setAcademicLevelActivation(
        schoolSlug,
        level.id,
        nextActivated,
      );
      setLevels((current) =>
        current.map((entry) =>
          entry.id === level.id
            ? { ...entry, isActivated: nextActivated }
            : entry,
        ),
      );
      showSuccess({
        title: t("schoolSettings.levels.success.saved"),
        message: "",
      });
    } catch (error) {
      showError({
        title: t("schoolSettings.levels.errors.toggle"),
        message: extractApiError(error),
      });
    } finally {
      setTogglingLevelId(null);
    }
  }

  async function saveOrder(level: CurriculumAcademicLevel) {
    if (!schoolSlug || level.isNational !== false) return;
    const draft = orderDrafts[level.id] ?? "";
    const parsed = draft.trim() === "" ? undefined : Number(draft);
    if (parsed !== undefined && (!Number.isInteger(parsed) || parsed < 0)) {
      showError({
        title: t("schoolSettings.levels.errors.invalidOrder"),
        message: "",
      });
      return;
    }
    setSavingOrderId(level.id);
    try {
      await curriculumsApi.updateAcademicLevel(schoolSlug, level.id, {
        order: parsed,
      });
      setLevels((current) =>
        current.map((entry) =>
          entry.id === level.id ? { ...entry, order: parsed ?? null } : entry,
        ),
      );
      showSuccess({
        title: t("schoolSettings.levels.success.saved"),
        message: "",
      });
    } catch (error) {
      showError({
        title: t("schoolSettings.levels.errors.save"),
        message: extractApiError(error),
      });
    } finally {
      setSavingOrderId(null);
    }
  }

  if (!canAccessModule) {
    return (
      <View style={styles.screen}>
        <ModuleHeader
          title={t("schoolSettings.title")}
          onBack={() => moduleBack(router)}
          topInset={insets.top}
          testID="school-settings-header"
        />
        <View style={styles.lockedWrap}>
          <EmptyState
            icon="options-outline"
            title={t("schoolSettings.lockedTitle")}
            message={t("schoolSettings.lockedMessage")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ModuleHeader
        title={t("schoolSettings.title")}
        onBack={() => moduleBack(router)}
        topInset={insets.top}
        testID="school-settings-header"
        backTestID="school-settings-back-btn"
        helpAction={{
          label: t("schoolSettings.help.menuLabel"),
          onPress: () => {
            setHelpVisible(true);
            advanceOnboardingTourTarget(
              SCHOOL_SETTINGS_TOUR_TARGETS.helpToggle,
            );
          },
          testID: "school-settings-help-menu-item",
        }}
        menuTourTargetId={SCHOOL_SETTINGS_TOUR_TARGETS.helpToggle}
      />
      <UnderlineTabs<SettingsTab>
        items={[{ key: "levels", label: t("schoolSettings.tabs.levels") }]}
        activeKey={tab}
        onSelect={setTab}
        testIDPrefix="school-settings-tab"
        tourTargetId="school-settings-levels-tab"
      />

      {isLoading ? (
        <LoadingBlock label={t("common.loading")} />
      ) : tab === "levels" ? (
        levels.length === 0 ? (
          <View style={styles.lockedWrap}>
            <EmptyState
              icon="layers-outline"
              title={t("schoolSettings.levels.empty.title")}
              message={t("schoolSettings.levels.empty.message")}
            />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            testID="school-settings-levels-list"
          >
            <Text style={styles.intro}>{t("schoolSettings.levels.intro")}</Text>
            {orderedLevels.map((level, index) => {
              const isOwn = level.isNational === false;
              const row = (
                <View style={styles.card} testID={`level-row-${level.id}`}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.cardTitle}>{level.label}</Text>
                      <Text style={styles.cardSubtitle}>
                        {level.code} ·{" "}
                        {isOwn
                          ? t("schoolSettings.levels.own")
                          : t("schoolSettings.levels.national")}
                      </Text>
                    </View>
                    {isOwn ? (
                      <Text style={styles.alwaysActive}>
                        {t("schoolSettings.levels.alwaysActive")}
                      </Text>
                    ) : (
                      <Switch
                        value={!!level.isActivated}
                        onValueChange={() => toggleActivation(level)}
                        disabled={togglingLevelId === level.id}
                        trackColor={{
                          false: colors.warmBorder,
                          true: colors.accentTeal,
                        }}
                        thumbColor={colors.white}
                        testID={`level-row-${level.id}-toggle`}
                      />
                    )}
                  </View>

                  {isOwn ? (
                    <View style={styles.orderRow}>
                      <Text style={styles.orderLabel}>
                        {t("schoolSettings.levels.orderLabel")}
                      </Text>
                      <TextInput
                        value={orderDrafts[level.id] ?? ""}
                        onChangeText={(value) =>
                          setOrderDrafts((current) => ({
                            ...current,
                            [level.id]: value.replace(/[^0-9]/g, ""),
                          }))
                        }
                        keyboardType="numeric"
                        placeholder="—"
                        placeholderTextColor={colors.textSecondary}
                        style={styles.orderInput}
                        testID={`level-row-${level.id}-order-input`}
                      />
                      <TouchableOpacity
                        style={[
                          styles.orderSaveButton,
                          savingOrderId === level.id &&
                            styles.orderSaveButtonDisabled,
                        ]}
                        disabled={savingOrderId === level.id}
                        onPress={() => saveOrder(level)}
                        testID={`level-row-${level.id}-order-save`}
                      >
                        <Text style={styles.orderSaveButtonText}>
                          {t("common.save")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.orderReadOnly}>
                      {t("schoolSettings.levels.orderLabel")}:{" "}
                      {level.order ?? "—"}
                    </Text>
                  )}
                </View>
              );
              return index === 0 ? (
                <OnboardingTarget
                  key={level.id}
                  id="school-settings-levels-first-row"
                >
                  {row}
                </OnboardingTarget>
              ) : (
                <React.Fragment key={level.id}>{row}</React.Fragment>
              );
            })}
          </ScrollView>
        )
      ) : null}

      <PageHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={t("schoolSettings.help.title")}
        sections={[1, 2].map((n) => ({
          title: t(`schoolSettings.help.section${n}Title`),
          body: [t(`schoolSettings.help.section${n}Body`)],
        }))}
        closeLabel={t("schoolSettings.help.close")}
        testID="school-settings-help"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  lockedWrap: { flex: 1, padding: 16, justifyContent: "center" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  intro: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardHeaderText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  cardSubtitle: { fontSize: 12, color: colors.textSecondary },
  alwaysActive: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accentTealDark,
    textTransform: "uppercase",
  },
  orderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  orderLabel: { fontSize: 12, color: colors.textSecondary },
  orderInput: {
    width: 56,
    height: 36,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#E0D0BA",
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  orderSaveButton: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  orderSaveButtonDisabled: { opacity: 0.5 },
  orderSaveButtonText: { fontSize: 12, fontWeight: "700", color: colors.white },
  orderReadOnly: { fontSize: 12, color: colors.textSecondary },
});
