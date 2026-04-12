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
import { getViewType } from "../navigation/nav-config";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PillSelector,
  SectionCard,
} from "./TimetableCommon";

export function TimetableClassesScreen() {
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
  const viewType = user ? getViewType(user) : "unknown";

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

  const screenTitle =
    viewType === "teacher"
      ? "Mes agendas de classe"
      : "Gestion des emplois du temps";
  const screenSubtitle =
    viewType === "teacher"
      ? "Accès rapide aux classes enseignées. Ouvrez une classe pour consulter ou gérer son planning."
      : "Point d'entrée mobile pour les classes, les créneaux et les fermetures d'établissement.";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
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
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{screenTitle}</Text>
            <Text style={styles.subtitle}>{screenSubtitle}</Text>
          </View>
        </View>

        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        <SectionCard
          title="Année scolaire"
          subtitle="Filtrez vos classes pour garder un périmètre clair avant de gérer le planning."
        >
          <PillSelector
            label="Année"
            value={effectiveYearId}
            onChange={(value) => {
              setSelectedSchoolYearId(value);
              void load(value).catch(() => {});
            }}
            options={schoolYears.map((year) => ({
              value: year.id,
              label: year.isActive ? `${year.label} • active` : year.label,
            }))}
            testIDPrefix="timetable-school-year"
          />
        </SectionCard>

        <SectionCard
          title="Classes accessibles"
          subtitle="Le module ouvre la page agenda mobile de la classe. Les restrictions backend du rôle enseignant restent respectées."
        >
          {isLoadingClassOptions && !classOptions ? (
            <LoadingBlock label="Chargement des classes..." />
          ) : filteredClasses.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title="Aucune classe trouvée"
              message="Aucune affectation exploitable n'a été trouvée sur cette année."
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
                        {item.schoolYearLabel} • {item.studentCount} élève
                        {item.studentCount > 1 ? "s" : ""}
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
  header: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.primary}12`,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
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
