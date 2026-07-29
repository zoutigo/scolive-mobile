import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { familyApi, type AdminStudentRow } from "../../api/family.api";
import { classroomsApi } from "../../api/classrooms.api";
import { extractApiError } from "../../utils/api-error";
import { moduleBack } from "../../utils/moduleBack";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { EmptyState, LoadingBlock } from "../timetable/TimetableCommon";
import { useTranslation } from "../../i18n/useTranslation";

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

function fullStudentName(student: AdminStudentRow) {
  return `${student.firstName} ${student.lastName}`.trim();
}

export function AddStudentToClassScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { schoolSlug } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [meta, setMeta] = useState<{ page: number; hasMore: boolean } | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [addingStudentId, setAddingStudentId] = useState<string | null>(null);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadStudents = useCallback(
    async (page: number, search: string, mode: "reset" | "append") => {
      if (!schoolSlug) return;
      if (mode === "append") setIsLoadingMore(true);
      else setIsLoading(true);
      try {
        const result = await familyApi.listAdminStudents(schoolSlug, {
          search: search || undefined,
          page,
          limit: PAGE_SIZE,
        });
        setStudents((current) =>
          mode === "append"
            ? [...current, ...result.students]
            : result.students,
        );
        setMeta({ page: result.page, hasMore: result.hasMore });
      } catch (error) {
        showError({
          title: t("classesAdmin.form.errorTitle"),
          message: extractApiError(error),
        });
      } finally {
        if (mode === "append") setIsLoadingMore(false);
        else setIsLoading(false);
      }
    },
    [schoolSlug, showError],
  );

  useEffect(() => {
    void loadStudents(1, appliedSearch, "reset");
  }, [appliedSearch, loadStudents]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setAppliedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  function handleLoadMore() {
    if (!meta || isLoadingMore || !meta.hasMore) return;
    void loadStudents(meta.page + 1, appliedSearch, "append");
  }

  async function handleAddStudent(student: AdminStudentRow) {
    if (!schoolSlug || !classId || addingStudentId) return;
    setAddingStudentId(student.id);
    try {
      await classroomsApi.createEnrollment(schoolSlug, student.id, {
        classId,
      });
      showSuccess({
        title: t("classesAdmin.addStudent.successTitle"),
        message: `${fullStudentName(student)} ${t("classesAdmin.addStudent.successMessageSuffix")}`,
      });
      router.back();
    } catch (error) {
      showError({
        title: t("classesAdmin.form.errorTitle"),
        message: extractApiError(error),
      });
    } finally {
      setAddingStudentId(null);
    }
  }

  return (
    <View style={styles.root} testID="add-student-screen">
      <ModuleHeader
        title={t("classesAdmin.addStudent.headerTitle")}
        onBack={() => moduleBack(router)}
        testID="add-student-header"
        backTestID="add-student-back"
        titleTestID="add-student-title"
        topInset={insets.top}
      />

      <View style={styles.searchRow} testID="add-student-search-row">
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={t("classesAdmin.addStudent.searchPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoCapitalize="none"
            testID="add-student-search-input"
          />
          {searchInput.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchInput("")}
              testID="add-student-search-clear"
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <LoadingBlock label={t("classesAdmin.addStudent.loading")} />
        </View>
      ) : (
        <InfiniteScrollList
          data={students}
          keyExtractor={(item) => item.id}
          onLoadMore={handleLoadMore}
          hasMore={meta?.hasMore ?? false}
          isLoadingMore={isLoadingMore}
          contentContainerStyle={styles.listContent}
          testID="add-student-list"
          emptyComponent={
            <View style={styles.centered}>
              <EmptyState
                icon="people-outline"
                title={t("classesAdmin.addStudent.empty.title")}
                message={t("classesAdmin.addStudent.empty.message")}
              />
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.studentRow}
              onPress={() => void handleAddStudent(item)}
              disabled={addingStudentId === item.id}
              testID={`add-student-row-${item.id}`}
            >
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{fullStudentName(item)}</Text>
                {item.currentEnrollment ? (
                  <Text style={styles.studentMeta}>
                    {item.currentEnrollment.class.name}
                  </Text>
                ) : null}
              </View>
              {addingStudentId === item.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          )}
        />
      )}
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 10,
    padding: 14,
  },
  studentInfo: {
    flex: 1,
    gap: 3,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  studentMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
