import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { classroomsApi } from "../../api/classrooms.api";
import { familyApi, type AdminStudentRow } from "../../api/family.api";
import type { ClassroomAdminRow } from "../../types/classrooms.types";
import { extractApiError } from "../../utils/api-error";
import { moduleBack } from "../../utils/moduleBack";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { MultiActionFab, type FabAction } from "../navigation/MultiActionFab";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { FormHero } from "../forms/FormHero";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "../timetable/TimetableCommon";
import { useTranslation } from "../../i18n/useTranslation";

const PAGE_SIZE = 100;

function fullStudentName(student: AdminStudentRow) {
  return `${student.firstName} ${student.lastName}`.trim();
}

export function ClassStudentsScreen({
  showHeader = true,
}: {
  showHeader?: boolean;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { schoolSlug } = useAuthStore();

  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";

  const [classroom, setClassroom] = useState<ClassroomAdminRow | null>(null);
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!schoolSlug || !classId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [classroomResult, studentsResult] = await Promise.all([
        classroomsApi.getClassroom(schoolSlug, classId),
        familyApi.listAdminStudents(schoolSlug, {
          classId,
          status: "ACTIVE",
          limit: PAGE_SIZE,
        }),
      ]);
      setClassroom(classroomResult);
      setStudents(studentsResult.students);
    } catch (error) {
      setErrorMessage(extractApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, [schoolSlug, classId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const referentName = classroom?.referentTeacher
    ? `${classroom.referentTeacher.firstName} ${classroom.referentTeacher.lastName}`.trim()
    : t("classesAdmin.card.noReferent");

  const studentCount = classroom?._count?.enrollments ?? students.length;
  const capacityLabel =
    classroom?.capacity != null
      ? `${studentCount}/${classroom.capacity}`
      : `${studentCount}`;

  const fabActions: FabAction[] = classId
    ? [
        {
          key: "add-student",
          icon: "person-add-outline",
          label: t("classesAdmin.students.fabAdd"),
          onPress: () =>
            router.push({
              pathname: "/(home)/admin-classes/[classId]/students/add",
              params: { classId },
            }),
          testID: "class-students-fab-add",
        },
        {
          key: "set-referent",
          icon: "person-outline",
          label: t("classesAdmin.students.fabReferent"),
          onPress: () =>
            router.push({
              pathname: "/(home)/admin-classes/[classId]/students/referent",
              params: { classId },
            }),
          testID: "class-students-fab-referent",
        },
      ]
    : [];

  return (
    <View style={styles.root} testID="class-students-screen">
      {showHeader ? (
        <ModuleHeader
          title={t("classesAdmin.students.headerTitle")}
          onBack={() => moduleBack(router)}
          testID="class-students-header"
          backTestID="class-students-back"
          titleTestID="class-students-title"
          topInset={insets.top}
        />
      ) : null}

      {errorMessage ? (
        <View style={styles.centered}>
          <ErrorBanner
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
            testID="class-students-error"
          />
        </View>
      ) : isLoading && !classroom ? (
        <View style={styles.centered}>
          <LoadingBlock label={t("classesAdmin.students.loading")} />
        </View>
      ) : (
        <InfiniteScrollList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          testID="class-students-list"
          ListHeaderComponent={
            classroom ? (
              <FormHero
                icon="school-outline"
                title={classroom.name}
                subtitle={referentName}
                palette="primary"
                testID="class-students-hero"
                footer={
                  <Text
                    style={styles.heroFooter}
                    testID="class-students-hero-count"
                  >
                    {capacityLabel} {t("classesAdmin.students.studentsSuffix")}
                  </Text>
                }
              />
            ) : null
          }
          emptyComponent={
            <View style={styles.centered}>
              <EmptyState
                icon="people-outline"
                title={t("classesAdmin.students.empty.title")}
                message={t("classesAdmin.students.empty.message")}
              />
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={styles.studentRow}
              testID={`class-students-row-${item.id}`}
            >
              <Text style={styles.studentName}>{fullStudentName(item)}</Text>
            </View>
          )}
        />
      )}

      <MultiActionFab
        bottom={insets.bottom + 20 + BOTTOM_TAB_BAR_HEIGHT}
        testID="class-students-fab"
        actions={fabActions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 96,
    gap: 10,
  },
  heroFooter: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
  studentRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 10,
    padding: 14,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
