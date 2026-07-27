import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useTeacherClassNavStore } from "../../store/teacher-class-nav.store";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { MultiActionFab, type FabAction } from "../navigation/MultiActionFab";
import { TeacherClassDisciplineScreen } from "../discipline/TeacherClassDisciplineScreen";
import { TeacherAgendaScreenInner } from "../timetable/TeacherAgendaScreen";
import { ClassHomeworkScreen } from "../homework/ClassHomeworkScreen";
import { ClassNotesManagerScreen } from "../notes/ClassNotesManagerScreen";
import { TeacherClassFeedScreen } from "../feed/TeacherClassFeedScreen";
import { useTranslation, type TranslateFn } from "../../i18n/useTranslation";
import { moduleBack } from "../../utils/moduleBack";

type TabKey = "discipline" | "agenda" | "devoirs" | "notes" | "fil";

function buildTabs(t: TranslateFn) {
  return [
    { key: "discipline" as const, label: "Discipline" },
    { key: "agenda" as const, label: "Agenda" },
    { key: "devoirs" as const, label: t("homework.label") },
    { key: "notes" as const, label: "Notes" },
    { key: "fil" as const, label: "Fil" },
  ];
}

export function AdminClassDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { schoolSlug } = useAuthStore();
  const { classOptions, loadClassOptions } = useTeacherClassNavStore();
  const TABS = useMemo(() => buildTabs(t), [t]);

  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";

  const [activeTab, setActiveTab] = useState<TabKey>("discipline");

  useEffect(() => {
    if (schoolSlug && !classOptions && classId) {
      void loadClassOptions(schoolSlug).catch(() => {});
    }
  }, [schoolSlug, classOptions, classId, loadClassOptions]);

  const className =
    classOptions?.classes.find((c) => c.classId === classId)?.className ?? null;

  const viewStudentsAction: FabAction[] = classId
    ? [
        {
          key: "view-students",
          icon: "people-outline",
          label: t("classesAdmin.detail.fabViewStudents"),
          onPress: () =>
            router.push({
              pathname: "/(home)/admin-classes/[classId]/students",
              params: { classId },
            }),
          testID: "admin-class-detail-fab-students",
        },
      ]
    : [];

  const fabBottom = insets.bottom + 20 + BOTTOM_TAB_BAR_HEIGHT;
  const hasTabOwnFab =
    activeTab === "discipline" ||
    activeTab === "devoirs" ||
    activeTab === "notes";

  return (
    <View style={styles.root} testID="admin-class-detail-screen">
      <ModuleHeader
        title="Classes"
        subtitle={className}
        onBack={() => moduleBack(router)}
        testID="admin-class-detail-header"
        backTestID="admin-class-detail-back"
        titleTestID="admin-class-detail-title"
        subtitleTestID="admin-class-detail-subtitle"
        topInset={insets.top}
      />

      <UnderlineTabs
        items={TABS}
        activeKey={activeTab}
        onSelect={setActiveTab}
        testIDPrefix="admin-class-detail-tab"
      />

      <View style={styles.tabContent}>
        {activeTab === "discipline" ? (
          <TeacherClassDisciplineScreen
            showHeader={false}
            extraFabActions={viewStudentsAction}
          />
        ) : activeTab === "agenda" ? (
          <TeacherAgendaScreenInner
            initialTab="classes"
            lockedClassId={classId}
            lockedClassName={className ?? undefined}
            hideClassPicker
            headerTitle="Emploi du temps"
            lockedClassTabLabel="Emploi du temps"
            showHeader={false}
          />
        ) : activeTab === "devoirs" ? (
          <ClassHomeworkScreen
            showHeader={false}
            extraFabActions={viewStudentsAction}
          />
        ) : activeTab === "notes" ? (
          <ClassNotesManagerScreen
            showHeader={false}
            extraFabActions={viewStudentsAction}
          />
        ) : (
          <TeacherClassFeedScreen showHeader={false} />
        )}
      </View>

      {!hasTabOwnFab ? (
        <MultiActionFab
          bottom={fabBottom}
          testID="admin-class-detail-fab"
          actions={viewStudentsAction}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContent: {
    flex: 1,
  },
});
