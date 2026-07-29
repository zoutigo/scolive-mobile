import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { classroomsApi } from "../../api/classrooms.api";
import { curriculumsApi } from "../../api/curriculums.api";
import { teachersApi } from "../../api/teachers.api";
import { extractApiError } from "../../utils/api-error";
import { moduleBack } from "../../utils/moduleBack";
import { useScrollToFirstError } from "../../hooks/useScrollToFirstError";
import { InlineSelectDropDown } from "../InlineSelectDropDown";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import { FormActions } from "../teachers/TeacherSheetCommons";
import { LoadingBlock, ErrorBanner } from "../timetable/TimetableCommon";
import { useTranslation } from "../../i18n/useTranslation";
import type {
  CurriculumAcademicLevel,
  CurriculumRow,
  CurriculumTrack,
} from "../../types/curriculums.types";
import type { TeacherRow } from "../../types/teachers.types";

const createClassSchema = z.object({
  name: z.string().trim().min(1, "Le nom de la classe est requis."),
  academicLevelId: z.string(),
  trackId: z.string(),
  curriculumId: z.string().min(1, "Le curriculum est requis."),
  referentTeacherUserId: z.string(),
  capacity: z
    .string()
    .refine(
      (value) => value === "" || /^[1-9][0-9]*$/.test(value),
      "La capacité doit être un nombre entier positif.",
    ),
});

type CreateClassFormValues = z.infer<typeof createClassSchema>;
type FieldName = keyof CreateClassFormValues;

const FIELD_ORDER: FieldName[] = [
  "name",
  "academicLevelId",
  "trackId",
  "curriculumId",
  "referentTeacherUserId",
  "capacity",
];

function fullTeacherName(teacher: TeacherRow) {
  return `${teacher.firstName} ${teacher.lastName}`.trim();
}

export function CreateClassScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { schoolSlug } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [academicLevels, setAcademicLevels] = useState<
    CurriculumAcademicLevel[]
  >([]);
  const [tracks, setTracks] = useState<CurriculumTrack[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInputRef = useRef<TextInput>(null);
  const capacityInputRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateClassFormValues>({
    resolver: zodResolver(createClassSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      academicLevelId: "",
      trackId: "",
      curriculumId: "",
      referentTeacherUserId: "",
      capacity: "",
    },
  });

  const {
    scrollViewRef,
    registerFieldOffset,
    registerFieldInputRef,
    focusFirstInvalidField,
  } = useScrollToFirstError<FieldName>();
  registerFieldInputRef("name", nameInputRef);
  registerFieldInputRef("capacity", capacityInputRef);

  const academicLevelId = watch("academicLevelId");

  const loadOptions = useCallback(async () => {
    if (!schoolSlug) return;
    setIsLoadingOptions(true);
    setLoadError(null);
    try {
      const [levels, trackList, curriculumList, teacherList] =
        await Promise.all([
          curriculumsApi.listAcademicLevels(schoolSlug),
          curriculumsApi.listTracks(schoolSlug),
          curriculumsApi.listCurriculums(schoolSlug),
          teachersApi.listTeachers(schoolSlug),
        ]);
      setAcademicLevels(levels);
      setTracks(trackList);
      setCurriculums(curriculumList);
      setTeachers(teacherList);
    } catch (error) {
      setLoadError(extractApiError(error));
    } finally {
      setIsLoadingOptions(false);
    }
  }, [schoolSlug]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const academicLevelOptions = useMemo(
    () => [
      { value: "", label: t("classesAdmin.form.noneOption") },
      ...academicLevels.map((level) => ({
        value: level.id,
        label: level.label,
      })),
    ],
    [academicLevels, t],
  );

  const trackOptions = useMemo(
    () => [
      { value: "", label: t("classesAdmin.form.noneOption") },
      ...tracks.map((track) => ({ value: track.id, label: track.label })),
    ],
    [tracks, t],
  );

  const curriculumOptions = useMemo(() => {
    const filtered = academicLevelId
      ? curriculums.filter((c) => c.academicLevelId === academicLevelId)
      : curriculums;
    return filtered.map((c) => ({
      value: c.id,
      label: c.track
        ? `${c.name} — ${c.academicLevel.label} · ${c.track.label}`
        : `${c.name} — ${c.academicLevel.label}`,
    }));
  }, [curriculums, academicLevelId]);

  const teacherOptions = useMemo(
    () => [
      { value: "", label: t("classesAdmin.form.noneOption") },
      ...teachers.map((teacher) => ({
        value: teacher.userId,
        label: fullTeacherName(teacher),
      })),
    ],
    [teachers, t],
  );

  const submitCreateClass = handleSubmit(
    async (values) => {
      if (!schoolSlug) return;
      setIsSubmitting(true);
      try {
        await classroomsApi.createClassroom(schoolSlug, {
          name: values.name.trim(),
          academicLevelId: values.academicLevelId || undefined,
          trackId: values.trackId || undefined,
          referentTeacherUserId: values.referentTeacherUserId || undefined,
          curriculumId: values.curriculumId,
          capacity: values.capacity ? Number(values.capacity) : undefined,
        });
        showSuccess({
          title: t("classesAdmin.form.successTitle"),
          message: t("classesAdmin.form.successMessage"),
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
    },
    (formErrors) => focusFirstInvalidField(FIELD_ORDER, formErrors),
  );

  return (
    <View style={styles.root} testID="create-class-screen">
      <ModuleHeader
        title={t("classesAdmin.form.headerTitle")}
        onBack={() => moduleBack(router)}
        testID="create-class-header"
        backTestID="create-class-back"
        titleTestID="create-class-title"
        topInset={insets.top}
      />

      {loadError ? (
        <View style={styles.centered}>
          <ErrorBanner
            message={loadError}
            onDismiss={() => setLoadError(null)}
            testID="create-class-error"
          />
        </View>
      ) : isLoadingOptions ? (
        <View style={styles.centered}>
          <LoadingBlock label={t("classesAdmin.form.loadingOptions")} />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.formsKeyboardArea}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FormHero
              icon="add-circle-outline"
              title={t("classesAdmin.form.heroTitle")}
              subtitle={t("classesAdmin.form.heroSubtitle")}
              palette="teal"
              testID="create-class-form-hero"
            />

            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <View
                  style={styles.formField}
                  onLayout={registerFieldOffset("name")}
                >
                  <Text style={styles.formLabel}>
                    {t("classesAdmin.form.nameLabel")}
                  </Text>
                  <TextInput
                    ref={nameInputRef}
                    style={[
                      styles.formInput,
                      errors.name && styles.formInputError,
                    ]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={t("classesAdmin.form.namePlaceholder")}
                    placeholderTextColor={colors.textSecondary}
                    testID="create-class-name"
                  />
                  {errors.name ? (
                    <Text
                      style={styles.formError}
                      testID="create-class-name-error"
                    >
                      {errors.name.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="academicLevelId"
              render={({ field: { value, onChange } }) => (
                <View
                  style={styles.formField}
                  onLayout={registerFieldOffset("academicLevelId")}
                >
                  <Text style={styles.formLabel}>
                    {t("classesAdmin.form.levelLabel")}
                  </Text>
                  <InlineSelectDropDown
                    options={academicLevelOptions}
                    value={value}
                    onChange={onChange}
                    placeholder={t("classesAdmin.form.levelPlaceholder")}
                    testID="create-class-level"
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="trackId"
              render={({ field: { value, onChange } }) => (
                <View
                  style={styles.formField}
                  onLayout={registerFieldOffset("trackId")}
                >
                  <Text style={styles.formLabel}>
                    {t("classesAdmin.form.trackLabel")}
                  </Text>
                  <InlineSelectDropDown
                    options={trackOptions}
                    value={value}
                    onChange={onChange}
                    placeholder={t("classesAdmin.form.trackPlaceholder")}
                    testID="create-class-track"
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="curriculumId"
              render={({ field: { value, onChange } }) => (
                <View
                  style={styles.formField}
                  onLayout={registerFieldOffset("curriculumId")}
                >
                  <Text style={styles.formLabel}>
                    {t("classesAdmin.form.curriculumLabel")}
                  </Text>
                  <InlineSelectDropDown
                    options={curriculumOptions}
                    value={value}
                    onChange={onChange}
                    placeholder={t("classesAdmin.form.curriculumPlaceholder")}
                    hasError={!!errors.curriculumId}
                    testID="create-class-curriculum"
                  />
                  {errors.curriculumId ? (
                    <Text
                      style={styles.formError}
                      testID="create-class-curriculum-error"
                    >
                      {errors.curriculumId.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="referentTeacherUserId"
              render={({ field: { value, onChange } }) => (
                <View
                  style={styles.formField}
                  onLayout={registerFieldOffset("referentTeacherUserId")}
                >
                  <Text style={styles.formLabel}>
                    {t("classesAdmin.form.referentLabel")}
                  </Text>
                  <InlineSelectDropDown
                    options={teacherOptions}
                    value={value}
                    onChange={onChange}
                    placeholder={t("classesAdmin.form.referentPlaceholder")}
                    testID="create-class-referent"
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="capacity"
              render={({ field: { value, onChange, onBlur } }) => (
                <View
                  style={styles.formField}
                  onLayout={registerFieldOffset("capacity")}
                >
                  <Text style={styles.formLabel}>
                    {t("classesAdmin.form.capacityLabel")}
                  </Text>
                  <TextInput
                    ref={capacityInputRef}
                    style={[
                      styles.formInput,
                      errors.capacity && styles.formInputError,
                    ]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    placeholder={t("classesAdmin.form.capacityPlaceholder")}
                    placeholderTextColor={colors.textSecondary}
                    testID="create-class-capacity"
                  />
                  {errors.capacity ? (
                    <Text
                      style={styles.formError}
                      testID="create-class-capacity-error"
                    >
                      {errors.capacity.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />
          </ScrollView>

          <View style={styles.formActionsBar}>
            <FormActions
              submitLabel={t("classesAdmin.form.submit")}
              isSubmitting={isSubmitting}
              onCancel={() => moduleBack(router)}
              onSubmit={() => void submitCreateClass()}
              testIDPrefix="create-class"
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
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
  },
  formInputError: {
    borderColor: "#B84A3B",
  },
  formError: {
    color: "#B84A3B",
    fontSize: 12,
    lineHeight: 16,
  },
});
