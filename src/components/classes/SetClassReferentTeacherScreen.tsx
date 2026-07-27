import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { classroomsApi } from "../../api/classrooms.api";
import { teachersApi } from "../../api/teachers.api";
import { extractApiError } from "../../utils/api-error";
import { moduleBack } from "../../utils/moduleBack";
import { InlineSelectDropDown } from "../InlineSelectDropDown";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import { FormActions } from "../teachers/TeacherSheetCommons";
import { LoadingBlock, ErrorBanner } from "../timetable/TimetableCommon";
import { useTranslation } from "../../i18n/useTranslation";
import type { TeacherRow } from "../../types/teachers.types";

const setReferentSchema = z.object({
  referentTeacherUserId: z
    .string()
    .min(1, "Choisissez un enseignant référent."),
});

type SetReferentFormValues = z.infer<typeof setReferentSchema>;

function fullTeacherName(teacher: TeacherRow) {
  return `${teacher.firstName} ${teacher.lastName}`.trim();
}

export function SetClassReferentTeacherScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { schoolSlug } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";

  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [className, setClassName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SetReferentFormValues>({
    resolver: zodResolver(setReferentSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { referentTeacherUserId: "" },
  });

  const loadData = useCallback(async () => {
    if (!schoolSlug || !classId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [classroom, teacherList] = await Promise.all([
        classroomsApi.getClassroom(schoolSlug, classId),
        teachersApi.listTeachers(schoolSlug),
      ]);
      setClassName(classroom.name);
      setTeachers(teacherList);
      reset({ referentTeacherUserId: classroom.referentTeacher?.id ?? "" });
    } catch (error) {
      setLoadError(extractApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, [schoolSlug, classId, reset]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const teacherOptions = useMemo(
    () =>
      teachers.map((teacher) => ({
        value: teacher.userId,
        label: fullTeacherName(teacher),
      })),
    [teachers],
  );

  const submitReferent = handleSubmit(async (values) => {
    if (!schoolSlug || !classId) return;
    setIsSubmitting(true);
    try {
      await classroomsApi.updateClassroom(schoolSlug, classId, {
        referentTeacherUserId: values.referentTeacherUserId,
      });
      showSuccess({
        title: t("classesAdmin.referent.successTitle"),
        message: t("classesAdmin.referent.successMessage"),
      });
      router.back();
    } catch (error) {
      showError({
        title: t("classesAdmin.form.errorTitle"),
        message: extractApiError(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <View style={styles.root} testID="set-referent-screen">
      <ModuleHeader
        title={t("classesAdmin.referent.headerTitle")}
        onBack={() => moduleBack(router)}
        testID="set-referent-header"
        backTestID="set-referent-back"
        titleTestID="set-referent-title"
        topInset={insets.top}
      />

      {loadError ? (
        <View style={styles.centered}>
          <ErrorBanner
            message={loadError}
            onDismiss={() => setLoadError(null)}
            testID="set-referent-error"
          />
        </View>
      ) : isLoading ? (
        <View style={styles.centered}>
          <LoadingBlock label={t("classesAdmin.form.loadingOptions")} />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.formsKeyboardArea}
        >
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FormHero
              icon="person-outline"
              title={t("classesAdmin.referent.heroTitle")}
              subtitle={className ?? undefined}
              palette="warm"
              testID="set-referent-form-hero"
            />

            <Controller
              control={control}
              name="referentTeacherUserId"
              render={({ field: { value, onChange } }) => (
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>
                    {t("classesAdmin.form.referentLabel")}
                  </Text>
                  <InlineSelectDropDown
                    options={teacherOptions}
                    value={value}
                    onChange={onChange}
                    placeholder={t("classesAdmin.form.referentPlaceholder")}
                    hasError={!!errors.referentTeacherUserId}
                    testID="set-referent-teacher"
                  />
                  {errors.referentTeacherUserId ? (
                    <Text
                      style={styles.formError}
                      testID="set-referent-teacher-error"
                    >
                      {errors.referentTeacherUserId.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />
          </ScrollView>

          <View style={styles.formActionsBar}>
            <FormActions
              submitLabel={t("classesAdmin.referent.submit")}
              isSubmitting={isSubmitting}
              onCancel={() => moduleBack(router)}
              onSubmit={() => void submitReferent()}
              testIDPrefix="set-referent"
            />
          </View>
        </KeyboardAvoidingView>
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
  formsKeyboardArea: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 16,
  },
  formActionsBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 10,
  },
  formField: {
    gap: 8,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
  },
  formError: {
    color: "#B84A3B",
    fontSize: 12,
    lineHeight: 16,
  },
});
