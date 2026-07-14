import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ModalFrame,
  CompactSelectField,
  FormActions,
} from "./TeacherSheetCommons";
import type {
  TeacherAssignmentRow,
  TeacherClassroomOption,
  TeacherRow,
  TeacherSchoolYearOption,
  TeacherSubjectOption,
} from "../../types/teachers.types";
import { toLocalPhoneDisplay } from "../account/account.schemas";
import { useScrollToFirstError } from "../../hooks/useScrollToFirstError";

export const teacherAssignmentFormSchema = z.object({
  schoolYearId: z.string().trim().min(1, "L'année scolaire est obligatoire."),
  teacherUserId: z.string().trim().min(1, "L'enseignant est obligatoire."),
  classId: z.string().trim().min(1, "La classe est obligatoire."),
  subjectId: z.string().trim().min(1, "La matière est obligatoire."),
});

export type TeacherAssignmentFormValues = z.infer<
  typeof teacherAssignmentFormSchema
>;

function fullTeacherName(teacher: { firstName: string; lastName: string }) {
  return `${teacher.lastName} ${teacher.firstName}`.trim();
}

interface Props {
  visible: boolean;
  mode: "create" | "edit";
  item: TeacherAssignmentRow | null;
  isSubmitting?: boolean;
  teacherOptions: TeacherRow[];
  schoolYears: TeacherSchoolYearOption[];
  classrooms: TeacherClassroomOption[];
  subjects: TeacherSubjectOption[];
  /** Pré-sélectionne un enseignant et verrouille le champ */
  lockedTeacherUserId?: string;
  onClose: () => void;
  onSubmit: (values: TeacherAssignmentFormValues) => Promise<void> | void;
}

export function TeacherAssignmentSheet(props: Props) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TeacherAssignmentFormValues>({
    resolver: zodResolver(teacherAssignmentFormSchema),
    mode: "onChange",
    defaultValues: {
      schoolYearId: "",
      teacherUserId: "",
      classId: "",
      subjectId: "",
    },
  });

  const schoolYearId = watch("schoolYearId");

  const { scrollViewRef, registerFieldOffset, focusFirstInvalidField } =
    useScrollToFirstError<keyof TeacherAssignmentFormValues>();
  const FIELD_ORDER: Array<keyof TeacherAssignmentFormValues> = [
    "schoolYearId",
    "teacherUserId",
    "classId",
    "subjectId",
  ];

  useEffect(() => {
    if (!props.visible) return;
    const activeSchoolYear =
      props.schoolYears.find((y) => y.isActive) ?? props.schoolYears[0];
    const defaultTeacherId =
      props.lockedTeacherUserId ??
      props.item?.teacherUserId ??
      props.teacherOptions[0]?.userId ??
      "";
    reset({
      schoolYearId: props.item?.schoolYearId ?? activeSchoolYear?.id ?? "",
      teacherUserId: defaultTeacherId,
      classId: props.item?.classId ?? "",
      subjectId: props.item?.subjectId ?? props.subjects[0]?.id ?? "",
    });
  }, [
    props.item,
    props.lockedTeacherUserId,
    props.schoolYears,
    props.subjects,
    props.teacherOptions,
    props.visible,
    reset,
  ]);

  const teacherOptions = useMemo(
    () =>
      props.teacherOptions.map((t) => ({
        value: t.userId,
        label: fullTeacherName(t),
        meta: t.email ?? (toLocalPhoneDisplay(t.phone) || undefined),
      })),
    [props.teacherOptions],
  );

  const schoolYearOptions = useMemo(
    () =>
      props.schoolYears.map((y) => ({
        value: y.id,
        label: y.label,
        meta: y.isActive ? "Année active" : undefined,
      })),
    [props.schoolYears],
  );

  const classOptions = useMemo(
    () =>
      props.classrooms
        .filter((c) => !schoolYearId || c.schoolYear.id === schoolYearId)
        .map((c) => ({
          value: c.id,
          label: c.name,
          meta: c.schoolYear.label,
        })),
    [props.classrooms, schoolYearId],
  );

  const subjectOptions = useMemo(
    () => props.subjects.map((s) => ({ value: s.id, label: s.name })),
    [props.subjects],
  );

  const isTeacherLocked = !!props.lockedTeacherUserId;

  return (
    <ModalFrame
      visible={props.visible}
      title={
        props.mode === "create"
          ? "Nouvelle affectation"
          : "Modifier l'affectation"
      }
      eyebrow={
        props.mode === "create" ? "Organisation pédagogique" : "Mise à jour"
      }
      subtitle="Associez un enseignant, une classe, une matière et une année scolaire."
      onClose={props.onClose}
      testID="teacher-assignment-sheet"
      scrollRef={scrollViewRef}
      footer={
        <FormActions
          submitLabel={
            props.mode === "create" ? "Créer l'affectation" : "Enregistrer"
          }
          isSubmitting={props.isSubmitting}
          onCancel={props.onClose}
          onSubmit={handleSubmit(props.onSubmit, (errs) =>
            focusFirstInvalidField(FIELD_ORDER, errs),
          )}
          testIDPrefix="teacher-assignment"
        />
      }
    >
      <View onLayout={registerFieldOffset("schoolYearId")}>
        <Controller
          control={control}
          name="schoolYearId"
          render={({ field: { value, onChange } }) => (
            <CompactSelectField
              label="Année scolaire"
              value={value}
              options={schoolYearOptions}
              placeholder="Choisir une année"
              onChange={onChange}
              error={errors.schoolYearId?.message}
              testID="teacher-assignment-school-year"
            />
          )}
        />
      </View>
      <View onLayout={registerFieldOffset("teacherUserId")}>
        <Controller
          control={control}
          name="teacherUserId"
          render={({ field: { value, onChange } }) => (
            <CompactSelectField
              label="Enseignant"
              value={value}
              options={teacherOptions}
              placeholder="Choisir un enseignant"
              onChange={isTeacherLocked ? () => {} : onChange}
              error={errors.teacherUserId?.message}
              testID="teacher-assignment-teacher"
            />
          )}
        />
      </View>
      <View onLayout={registerFieldOffset("classId")}>
        <Controller
          control={control}
          name="classId"
          render={({ field: { value, onChange } }) => (
            <CompactSelectField
              label="Classe"
              value={value}
              options={classOptions}
              placeholder="Choisir une classe"
              onChange={onChange}
              error={errors.classId?.message}
              testID="teacher-assignment-class"
            />
          )}
        />
      </View>
      <View onLayout={registerFieldOffset("subjectId")}>
        <Controller
          control={control}
          name="subjectId"
          render={({ field: { value, onChange } }) => (
            <CompactSelectField
              label="Matière"
              value={value}
              options={subjectOptions}
              placeholder="Choisir une matière"
              onChange={onChange}
              error={errors.subjectId?.message}
              testID="teacher-assignment-subject"
            />
          )}
        />
      </View>
    </ModalFrame>
  );
}
