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
import { useNotesStore } from "../../store/notes.store";
import { getViewType } from "../navigation/nav-config";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PillSelector,
  SectionCard,
} from "../timetable/TimetableCommon";

export function NotesClassesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { schoolSlug, user } = useAuthStore();
  const {
    classOptions,
    isLoadingClassOptions,
    errorMessage,
    loadClassOptions,
    clearError,
  } = useNotesStore();
  const viewType = user ? getViewType(user) : "unknown";
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState(
    classOptions?.selectedSchoolYearId ?? "",
  );

  const load = useCallback(async () => {
    if (!schoolSlug) return;
    const payload = await loadClassOptions(
      schoolSlug,
      selectedSchoolYearId || undefined,
    );
    if (!selectedSchoolYearId && payload.selectedSchoolYearId) {
      setSelectedSchoolYearId(payload.selectedSchoolYearId);
    }
  }, [loadClassOptions, schoolSlug, selectedSchoolYearId]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  const filteredClasses = useMemo(() => {
    const entries = classOptions?.classes ?? [];
    if (!selectedSchoolYearId) return entries;
    return entries.filter(
      (entry) => entry.schoolYearId === selectedSchoolYearId,
    );
  }, [classOptions?.classes, selectedSchoolYearId]);

  const screenLabel =
    viewType === "teacher" ? "Cahier de notes" : "Notes & évaluations";

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
              void load().catch(() => {});
            }}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard} testID="notes-classes-header">
          <View style={styles.headerIcon}>
            <Ionicons name="journal-outline" size={22} color={colors.white} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              {viewType === "teacher"
                ? "Portail enseignant"
                : "Portail établissement"}
            </Text>
            <Text style={styles.title}>{screenLabel}</Text>
            <Text style={styles.subtitle}>
              Sélectionnez une classe pour gérer les évaluations, les notes
              publiées et les appréciations de période.
            </Text>
          </View>
        </View>

        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        <SectionCard
          title="Filtrer par année"
          subtitle="Les classes accessibles dépendent de vos affectations et de votre rôle."
        >
          <PillSelector
            label="Année scolaire"
            value={
              selectedSchoolYearId || classOptions?.selectedSchoolYearId || ""
            }
            options={(classOptions?.schoolYears ?? []).map((entry) => ({
              value: entry.id,
              label: entry.label,
            }))}
            onChange={setSelectedSchoolYearId}
            testIDPrefix="notes-class-year"
          />
        </SectionCard>

        <SectionCard
          title="Classes accessibles"
          subtitle="Accédez au cahier de notes de chaque classe et reprenez là où vous vous êtes arrêté."
        >
          {isLoadingClassOptions && !classOptions ? (
            <LoadingBlock label="Chargement des classes..." />
          ) : filteredClasses.length === 0 ? (
            <EmptyState
              icon="school-outline"
              title="Aucune classe disponible"
              message="Aucune classe accessible n'a été trouvée pour ce profil."
            />
          ) : (
            <View style={styles.classList}>
              {filteredClasses.map((entry) => (
                <TouchableOpacity
                  key={entry.classId}
                  style={styles.classCard}
                  onPress={() =>
                    router.push({
                      pathname: "/(home)/notes/class/[classId]",
                      params: {
                        classId: entry.classId,
                        schoolYearId: entry.schoolYearId,
                      },
                    })
                  }
                  testID={`notes-class-card-${entry.classId}`}
                >
                  <View style={styles.classTopRow}>
                    <View style={styles.classBadge}>
                      <Ionicons
                        name="school-outline"
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.classTextBlock}>
                      <Text style={styles.className}>{entry.className}</Text>
                      <Text style={styles.classMeta}>
                        {entry.schoolYearLabel} • {entry.studentCount} élèves
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </View>

                  <View style={styles.subjectWrap}>
                    {entry.subjects.map((subject) => (
                      <View key={subject.id} style={styles.subjectPill}>
                        <Text style={styles.subjectPillText}>
                          {subject.name}
                        </Text>
                      </View>
                    ))}
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
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, gap: 16 },
  headerCard: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: -8,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, gap: 4 },
  eyebrow: {
    color: "rgba(255,255,255,0.78)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: "700",
  },
  title: { color: colors.white, fontSize: 22, fontWeight: "700" },
  subtitle: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    lineHeight: 18,
  },
  classList: { gap: 12 },
  classCard: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
    shadowColor: "#0C5FA8",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  classTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  classBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#eaf2fa",
    alignItems: "center",
    justifyContent: "center",
  },
  classTextBlock: { flex: 1, gap: 3 },
  className: { color: colors.textPrimary, fontSize: 17, fontWeight: "800" },
  classMeta: { color: colors.textSecondary, fontSize: 12 },
  subjectWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  subjectPill: {
    borderRadius: 999,
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  subjectPillText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "600",
  },
});
