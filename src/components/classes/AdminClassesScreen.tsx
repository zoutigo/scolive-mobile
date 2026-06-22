import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useTeacherClassNavStore } from "../../store/teacher-class-nav.store";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { LoadingBlock, ErrorBanner } from "../timetable/TimetableCommon";
import { ClassSelectModal } from "./ClassSelectModal";

export function AdminClassesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { schoolSlug } = useAuthStore();
  const {
    classOptions,
    isLoadingClassOptions,
    errorMessage,
    loadClassOptions,
    clearError,
  } = useTeacherClassNavStore();

  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (
      schoolSlug &&
      !classOptions &&
      !isLoadingClassOptions &&
      !errorMessage
    ) {
      void loadClassOptions(schoolSlug).catch(() => {});
    }
  }, [
    schoolSlug,
    classOptions,
    isLoadingClassOptions,
    errorMessage,
    loadClassOptions,
  ]);

  const handleSelect = useCallback(
    (classId: string) => {
      setModalVisible(false);
      router.push({
        pathname: "/(home)/admin-classes/[classId]",
        params: { classId },
      });
    },
    [router],
  );

  return (
    <View style={styles.root} testID="admin-classes-screen">
      <ModuleHeader
        title="Classes"
        onBack={() => router.back()}
        testID="admin-classes-header"
        backTestID="admin-classes-back"
        titleTestID="admin-classes-title"
        topInset={insets.top}
      />

      <View style={styles.body}>
        {errorMessage ? (
          <ErrorBanner
            message={errorMessage}
            onDismiss={clearError}
            testID="admin-classes-error"
          />
        ) : null}

        {isLoadingClassOptions ? (
          <View style={styles.centered}>
            <LoadingBlock label="Chargement des classes…" />
          </View>
        ) : (
          <View style={styles.centered}>
            <Ionicons
              name="book-outline"
              size={56}
              color={colors.warmBorder}
              testID="admin-classes-empty-icon"
            />
            <Text style={styles.emptyTitle} testID="admin-classes-empty-title">
              Aucune classe sélectionnée
            </Text>
            <Text style={styles.emptyMessage}>
              Appuyez sur le bouton ci-dessous pour choisir une classe.
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.fab,
          { bottom: insets.bottom + 20 + BOTTOM_TAB_BAR_HEIGHT },
        ]}
        onPress={() => setModalVisible(true)}
        testID="admin-classes-fab"
        activeOpacity={0.85}
      >
        <Ionicons name="layers-outline" size={26} color={colors.white} />
      </TouchableOpacity>

      <ClassSelectModal
        visible={modalVisible}
        classes={classOptions?.classes ?? []}
        onSelect={handleSelect}
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
  body: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    color: colors.primary,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
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
