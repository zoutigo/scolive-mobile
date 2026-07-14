import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { schoolsApi } from "../../api/schools.api";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { useTranslation } from "../../i18n/useTranslation";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  SectionCard,
} from "../timetable/TimetableCommon";
import { colors } from "../../theme";
import { extractApiError } from "../../utils/api-error";
import type { SchoolDetails } from "../../types/schools.types";
import { moduleBack } from "../../utils/moduleBack";

/**
 * Vue plateforme en lecture seule du systeme scolaire national (filieres +
 * curriculums) d'une ecole arbitraire. Ecran dedie et independant de
 * CurriculumsAdminScreen, qui reste cable sur l'ecole de l'utilisateur
 * connecte : ici l'admin plateforme n'est affilie a aucune ecole.
 */
export function SchoolCurriculumOverviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{ schoolId?: string }>();
  const schoolId = typeof params.schoolId === "string" ? params.schoolId : "";

  const [details, setDetails] = useState<SchoolDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={details?.name ?? t("schoolsAdmin.detail.sections.schoolSystem")}
        subtitle={details?.slug ?? null}
        onBack={() => moduleBack(router)}
        testID="school-curriculum-overview-header"
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
            testID="school-curriculum-overview-error-banner"
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
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          testID="school-curriculum-overview-scroll"
        >
          {errorMessage ? (
            <ErrorBanner
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
              testID="school-curriculum-overview-error-banner"
            />
          ) : null}

          <SectionCard
            title={t("schoolsAdmin.detail.schoolSystemTracksTitle")}
            testID="school-curriculum-overview-tracks"
          >
            {details.tracks.length > 0 ? (
              <View style={styles.chipsRow}>
                {details.tracks.map((track) => (
                  <View key={track.id} style={styles.chip}>
                    <Text style={styles.chipText}>{track.label}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.mutedText}>
                {t("schoolsAdmin.detail.schoolSystemNoTracks")}
              </Text>
            )}
          </SectionCard>

          <SectionCard
            title={t("schoolsAdmin.detail.schoolSystemCurriculumsTitle")}
            testID="school-curriculum-overview-curriculums"
          >
            {details.curriculums.length > 0 ? (
              <View style={styles.curriculumList}>
                {details.curriculums.map((curriculum) => (
                  <View
                    key={curriculum.id}
                    style={styles.curriculumRow}
                    testID={`school-curriculum-overview-item-${curriculum.id}`}
                  >
                    <Ionicons
                      name="book-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.curriculumName}>
                        {curriculum.name}
                      </Text>
                      {curriculum.academicLevelLabel ||
                      curriculum.trackLabel ? (
                        <Text style={styles.curriculumMeta}>
                          {[
                            curriculum.academicLevelLabel,
                            curriculum.trackLabel,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.mutedText}>
                {t("schoolsAdmin.detail.schoolSystemNoCurriculums")}
              </Text>
            )}
          </SectionCard>
        </ScrollView>
      )}
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
    justifyContent: "center",
    padding: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  curriculumList: {
    gap: 10,
  },
  curriculumRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  curriculumName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  curriculumMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mutedText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
