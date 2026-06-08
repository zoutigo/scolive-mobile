import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useTeacherClassNavStore } from "../../store/teacher-class-nav.store";
import { useDrawer } from "../navigation/drawer-context";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { TeacherClassDisciplineScreen } from "../discipline/TeacherClassDisciplineScreen";
import { TeacherAgendaScreenInner } from "../timetable/TeacherAgendaScreen";
import { ClassHomeworkScreen } from "../homework/ClassHomeworkScreen";
import { ClassNotesManagerScreen } from "../notes/ClassNotesManagerScreen";
import { TeacherClassFeedScreen } from "../feed/TeacherClassFeedScreen";
import { ClassSelectModal } from "./ClassSelectModal";

type TabKey = "discipline" | "agenda" | "devoirs" | "notes" | "fil";

const TABS = [
  { key: "discipline" as const, label: "Discipline" },
  { key: "agenda" as const, label: "Agenda" },
  { key: "devoirs" as const, label: "Devoirs" },
  { key: "notes" as const, label: "Notes" },
  { key: "fil" as const, label: "Fil" },
];

export function AdminClassDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { schoolSlug } = useAuthStore();
  const { classOptions, loadClassOptions } = useTeacherClassNavStore();

  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";

  const [activeTab, setActiveTab] = useState<TabKey>("discipline");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (schoolSlug && !classOptions && classId) {
      void loadClassOptions(schoolSlug).catch(() => {});
    }
  }, [schoolSlug, classOptions, classId, loadClassOptions]);

  const className =
    classOptions?.classes.find((c) => c.classId === classId)?.className ?? null;

  const handleClassSelect = useCallback(
    (newClassId: string) => {
      setModalVisible(false);
      setActiveTab("discipline");
      router.replace({
        pathname: "/(home)/admin-classes/[classId]",
        params: { classId: newClassId },
      });
    },
    [router],
  );

  return (
    <View style={styles.root} testID="admin-class-detail-screen">
      <ModuleHeader
        title="Classes"
        subtitle={className}
        onBack={() => router.back()}
        rightIcon="menu-outline"
        onRightPress={openDrawer}
        testID="admin-class-detail-header"
        backTestID="admin-class-detail-back"
        titleTestID="admin-class-detail-title"
        subtitleTestID="admin-class-detail-subtitle"
        rightTestID="admin-class-detail-menu"
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
          <TeacherClassDisciplineScreen showHeader={false} />
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
          <ClassHomeworkScreen showHeader={false} />
        ) : activeTab === "notes" ? (
          <ClassNotesManagerScreen showHeader={false} />
        ) : (
          <TeacherClassFeedScreen showHeader={false} />
        )}
      </View>

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => setModalVisible(true)}
        testID="admin-class-detail-fab"
        activeOpacity={0.85}
      >
        <Ionicons name="layers-outline" size={26} color={colors.white} />
      </TouchableOpacity>

      <ClassSelectModal
        visible={modalVisible}
        classes={classOptions?.classes ?? []}
        onSelect={handleClassSelect}
        onDismiss={() => setModalVisible(false)}
      />
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
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
