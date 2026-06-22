import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useTimetableStore } from "../../store/timetable.store";
import { buildTeacherSubtitle } from "../navigation/nav-config";
import { ModuleHeader } from "../navigation/ModuleHeader";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PillSelector,
  SectionCard,
} from "./TimetableCommon";
import { useTranslation } from "../../i18n/useTranslation";

export function TimetableClassesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { schoolSlug, user } = useAuthStore();
  const {
    classOptions,
    isLoadingClassOptions,
    errorMessage,
    loadClassOptions,
    clearError,
  } = useTimetableStore();
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");

  const load = useCallback(
    async (schoolYearId?: string) => {
      if (!schoolSlug) return;
      const payload = await loadClassOptions(schoolSlug, schoolYearId);
      if (!selectedSchoolYearId && payload.selectedSchoolYearId) {
        setSelectedSchoolYearId(payload.selectedSchoolYearId);
      }
    },
    [loadClassOptions, schoolSlug, selectedSchoolYearId],
  );

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  const schoolYears = classOptions?.schoolYears ?? [];
  const effectiveYearId =
    selectedSchoolYearId || classOptions?.selectedSchoolYearId || "";

  const filteredClasses = useMemo(() => {
    if (!classOptions) return [];
    if (!effectiveYearId) return classOptions.classes;
    return classOptions.classes.filter(
      (entry) => entry.schoolYearId === effectiveYearId,
    );
  }, [classOptions, effectiveYearId]);

  const subtitle = user ? buildTeacherSubtitle(user) : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ModuleHeader
        title={t("timetable.classesScreen.headerTitle")}
        subtitle={subtitle}
        onBack={() => router.back()}
        testID="timetable-classes-header"
        backTestID="timetable-classes-back"
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: 8, paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingClassOptions}
            onRefresh={() => {
              clearError();
              void load(effectiveYearId || undefined).catch(() => {});
            }}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        <SectionCard
          title={t("timetable.classesScreen.schoolYear.title")}
          subtitle={t("timetable.classesScreen.schoolYear.subtitle")}
        >
          <PillSelector
            label={t("timetable.classesScreen.schoolYear.label")}
            value={effectiveYearId}
            onChange={(value) => {
              setSelectedSchoolYearId(value);
              void load(value).catch(() => {});
            }}
            options={schoolYears.map((year) => ({
              value: year.id,
              label: year.isActive
                ? `${year.label} • ${t("timetable.classesScreen.schoolYear.activeSuffix")}`
                : year.label,
            }))}
            testIDPrefix="timetable-school-year"
          />
        </SectionCard>

        <SectionCard
          title={t("timetable.classesScreen.classes.title")}
          subtitle={t("timetable.classesScreen.classes.subtitle")}
        >
          {isLoadingClassOptions && !classOptions ? (
            <LoadingBlock label={t("timetable.classesScreen.loading")} />
          ) : filteredClasses.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title={t("timetable.classesScreen.empty.title")}
              message={t("timetable.classesScreen.empty.message")}
            />
          ) : (
            <View style={styles.classList}>
              {filteredClasses.map((item) => (
                <TouchableOpacity
                  key={`${item.classId}-${item.schoolYearId}`}
                  style={styles.classRow}
                  onPress={() =>
                    router.push({
                      pathname: "/(home)/timetable/class/[classId]",
                      params: {
                        classId: item.classId,
                        schoolYearId: item.schoolYearId,
                      },
                    })
                  }
                  testID={`timetable-class-row-${item.classId}`}
                >
                  <View style={styles.classLeading}>
                    <View style={styles.classIcon}>
                      <Ionicons
                        name="school-outline"
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.classText}>
                      <Text style={styles.className}>{item.className}</Text>
                      <Text style={styles.classMeta}>
                        {item.schoolYearLabel} • {item.studentCount}{" "}
                        {item.studentCount > 1
                          ? t("timetable.classesScreen.studentPlural")
                          : t("timetable.classesScreen.studentSingular")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.subjectTags}>
                    {item.subjects.slice(0, 3).map((subject) => (
                      <View key={subject.id} style={styles.subjectTag}>
                        <Text style={styles.subjectTagText}>
                          {subject.name}
                        </Text>
                      </View>
                    ))}
                    {item.subjects.length > 3 ? (
                      <Text style={styles.moreText}>
                        +{item.subjects.length - 3}
                      </Text>
                    ) : null}
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SectionCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  classList: {
    gap: 10,
  },
  classRow: {
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  classLeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  classIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.primary}16`,
  },
  classText: {
    flex: 1,
    gap: 3,
  },
  className: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  classMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  subjectTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  subjectTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  subjectTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  moreText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
});
