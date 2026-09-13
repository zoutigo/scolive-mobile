/**
 * Entrée du module Santé pour l'enseignant référent d'une classe : liste des
 * élèves de sa classe avec un indicateur d'alerte, puis navigation vers la
 * fiche santé complète (en lecture seule) de l'élève sélectionné.
 * Accès strictement réservé au référent de la classe — l'API le vérifie
 * indépendamment de cet écran.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { moduleBack } from "../../utils/moduleBack";
import { ModuleHeader } from "../navigation/ModuleHeader";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "../timetable/TimetableCommon";
import { healthApi } from "../../api/health.api";
import {
  ALERT_LEVEL_COLORS,
  alertLevelLabel,
  type TeacherClassHealthRoster,
  type TeacherClassHealthRosterStudent,
} from "../../types/health.types";

export function TeacherClassHealthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { schoolSlug } = useAuthStore();
  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";

  const [roster, setRoster] = useState<TeacherClassHealthRoster | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!schoolSlug || !classId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await healthApi.getTeacherClassRoster(schoolSlug, classId);
      setRoster(result);
    } catch {
      setError(t("health.teacherReferent.errors.load"));
    } finally {
      setIsLoading(false);
    }
  }, [schoolSlug, classId]);

  useEffect(() => {
    void load();
  }, [load]);

  function goToStudent(student: TeacherClassHealthRosterStudent) {
    router.push({
      pathname: "/(home)/admin-sante/[studentId]",
      params: {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        className: roster?.class.name ?? "",
        age: student.age != null ? String(student.age) : "",
      },
    });
  }

  return (
    <View style={styles.root} testID="teacher-class-health-screen">
      <ModuleHeader
        title={t("health.teacherReferent.title")}
        subtitle={roster?.class.name}
        onBack={() => moduleBack(router)}
        topInset={insets.top}
      />

      {isLoading ? (
        <LoadingBlock label={t("health.parent.loading")} />
      ) : error ? (
        <ErrorBanner message={error} testID="teacher-class-health-error" />
      ) : (
        <FlatList
          data={roster?.items ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          testID="teacher-class-health-list"
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={t("health.teacherReferent.empty.title")}
              message={t("health.teacherReferent.empty.message")}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => goToStudent(item)}
              testID={`teacher-class-health-student-${item.id}`}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>
                  {item.lastName} {item.firstName}
                </Text>
                {item.age != null ? (
                  <Text style={styles.cardMeta}>
                    {item.age} {t("health.admin.eleves.card.ageUnit")}
                  </Text>
                ) : null}
              </View>
              {item.highestActiveAlertLevel ? (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        ALERT_LEVEL_COLORS[item.highestActiveAlertLevel].bg,
                    },
                  ]}
                  testID={`teacher-class-health-student-${item.id}-alert`}
                >
                  <Text
                    style={[
                      styles.badgeLabel,
                      {
                        color:
                          ALERT_LEVEL_COLORS[item.highestActiveAlertLevel].text,
                      },
                    ]}
                  >
                    {alertLevelLabel(t, item.highestActiveAlertLevel)}
                  </Text>
                </View>
              ) : null}
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 16, gap: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surface,
  },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  cardMeta: { fontSize: 12, color: colors.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeLabel: { fontSize: 11, fontWeight: "700" },
});
