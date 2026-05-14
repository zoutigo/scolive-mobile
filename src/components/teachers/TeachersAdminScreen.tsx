import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { teachersApi } from "../../api/teachers.api";
import { ConfirmDialog } from "../ConfirmDialog";
import { useDrawer } from "../navigation/drawer-context";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import {
  buildAdminSubtitle,
  getPortalLabel,
  getViewType,
} from "../navigation/nav-config";
import { colors } from "../../theme";
import { extractApiError } from "../../utils/api-error";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  SectionCard,
} from "../timetable/TimetableCommon";
import {
  normalizePhoneInput,
  PASSWORD_COMPLEXITY_REGEX,
  toLocalPhoneDisplay,
} from "../account/account.schemas";
import type {
  TeacherAssignmentPayload,
  TeacherAssignmentRow,
  TeacherClassroomOption,
  TeacherRow,
  TeacherSchoolYearOption,
  TeacherSubjectOption,
} from "../../types/teachers.types";

type TabKey = "teachers" | "assignments" | "help";
type TeacherSheetState = {
  visible: boolean;
};

type AssignmentSheetState = {
  visible: boolean;
  mode: "create" | "edit";
  item: TeacherAssignmentRow | null;
};

const PAGE_SIZE = 20;

const TAB_ITEMS = [
  { key: "teachers", label: "Enseignants" },
  { key: "assignments", label: "Affectations" },
  { key: "help", label: "Aide" },
] as const;

export const teacherCreateFormSchema = z
  .object({
    mode: z.enum(["phone", "email"]),
    phone: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d{9}$/.test(value), {
        message: "Numéro invalide (9 chiffres attendus).",
      }),
    pin: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d{6}$/.test(value), {
        message: "Le PIN doit contenir exactement 6 chiffres.",
      }),
    email: z.union([
      z.string().trim().email("Adresse email invalide."),
      z.literal(""),
    ]),
    password: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || PASSWORD_COMPLEXITY_REGEX.test(value), {
        message:
          "Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules et chiffres.",
      }),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "phone") {
      if (!(value.phone ?? "").trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "Le téléphone enseignant est obligatoire.",
        });
      }
      if (!(value.pin ?? "").trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pin"],
          message: "Le PIN initial est obligatoire.",
        });
      }
    }

    if (value.mode === "email") {
      if (!value.email.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "L'email enseignant est obligatoire.",
        });
      }
      if (!(value.password ?? "").trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Le mot de passe initial est obligatoire.",
        });
      }
    }
  });

export const teacherAssignmentFormSchema = z.object({
  schoolYearId: z.string().trim().min(1, "L'année scolaire est obligatoire."),
  teacherUserId: z.string().trim().min(1, "L'enseignant est obligatoire."),
  classId: z.string().trim().min(1, "La classe est obligatoire."),
  subjectId: z.string().trim().min(1, "La matière est obligatoire."),
});

function fullTeacherName(teacher: {
  firstName: string;
  lastName: string;
}): string {
  return `${teacher.lastName} ${teacher.firstName}`.trim();
}

function assignmentLabel(entry: TeacherAssignmentRow) {
  return `${entry.class.name} · ${entry.subject.name}`;
}

function assignmentSearchText(entry: TeacherAssignmentRow) {
  return [
    entry.class.name,
    entry.subject.name,
    entry.schoolYear.label,
    fullTeacherName(entry.teacherUser),
    entry.teacherUser.email ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function teacherSearchText(entry: TeacherRow) {
  return [
    fullTeacherName(entry),
    entry.email ?? "",
    toLocalPhoneDisplay(entry.phone),
  ]
    .join(" ")
    .toLowerCase();
}

function formatTeacherContact(entry: TeacherRow) {
  if (entry.email) return entry.email;
  const phone = toLocalPhoneDisplay(entry.phone);
  return phone ? `+237 ${phone}` : "Aucun contact principal";
}

function summarizeTeacherClasses(assignments: TeacherAssignmentRow[]) {
  const classNames = Array.from(
    new Set(assignments.map((entry) => entry.class.name)),
  ).sort((a, b) => a.localeCompare(b));

  if (classNames.length <= 2) {
    return classNames.join(" · ");
  }

  return `${classNames[0]} · ${classNames[1]} +${classNames.length - 2}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function roleAllowsAdmin(role: string | null | undefined) {
  return role === "SCHOOL_ADMIN" || role === "ADMIN" || role === "SUPER_ADMIN";
}

function buildTeacherPayload(values: z.infer<typeof teacherCreateFormSchema>) {
  if (values.mode === "phone") {
    return {
      phone: normalizePhoneInput(values.phone ?? ""),
      pin: (values.pin ?? "").trim(),
    };
  }

  return {
    email: values.email.trim().toLowerCase(),
    password: (values.password ?? "").trim(),
  };
}

function ModalFrame(props: {
  visible: boolean;
  title: string;
  eyebrow: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  testID: string;
}) {
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="slide"
      onRequestClose={props.onClose}
    >
      <View style={styles.sheetOverlay}>
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={props.onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetKeyboard}
        >
          <View style={styles.sheetCard} testID={props.testID}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeaderRow}>
                <View style={styles.sheetHeaderText}>
                  <Text style={styles.sheetEyebrow}>{props.eyebrow}</Text>
                  <Text style={styles.sheetTitle} numberOfLines={2}>
                    {props.title}
                  </Text>
                  {props.subtitle ? (
                    <Text style={styles.sheetSubtitle} numberOfLines={2}>
                      {props.subtitle}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.sheetClose}
                  onPress={props.onClose}
                  testID={`${props.testID}-close`}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color="rgba(255,255,255,0.9)"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              style={styles.sheetScrollArea}
              contentContainerStyle={styles.sheetBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {props.children}
            </ScrollView>
            <View style={styles.sheetFooter}>{props.footer}</View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

type TextFormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  error?: string;
  testID: string;
  keyboardType?: "default" | "numeric" | "email-address";
  autoCapitalize?: "none" | "sentences";
  secureTextEntry?: boolean;
};

const TextFormField = React.forwardRef<TextInput, TextFormFieldProps>(
  function TextFormField(props, ref) {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.formField}>
        <Text style={styles.formLabel}>{props.label}</Text>
        <TextInput
          ref={ref}
          value={props.value}
          onChangeText={props.onChangeText}
          onBlur={() => {
            setFocused(false);
            props.onBlur();
          }}
          onFocus={() => setFocused(true)}
          placeholder={props.placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={props.keyboardType}
          autoCapitalize={props.autoCapitalize}
          secureTextEntry={props.secureTextEntry}
          style={[
            styles.formInput,
            focused && styles.formInputFocused,
            props.error ? styles.formInputError : null,
          ]}
          testID={props.testID}
        />
        {props.error ? (
          <Text style={styles.formError} testID={`${props.testID}-error`}>
            {props.error}
          </Text>
        ) : null}
      </View>
    );
  },
);

function CompactSelectField(props: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; meta?: string }>;
  placeholder: string;
  onChange: (value: string) => void;
  testID: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected =
    props.options.find((option) => option.value === props.value) ?? null;

  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{props.label}</Text>
      <TouchableOpacity
        style={[
          styles.compactSelectTrigger,
          props.error ? styles.compactSelectTriggerError : null,
        ]}
        onPress={() => setOpen(true)}
        testID={props.testID}
      >
        <View style={styles.compactSelectTextWrap}>
          <Text style={styles.compactSelectValue} numberOfLines={1}>
            {selected?.label ?? props.placeholder}
          </Text>
          {selected?.meta ? (
            <Text style={styles.compactSelectMeta} numberOfLines={1}>
              {selected.meta}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {props.error ? (
        <Text style={styles.formError} testID={`${props.testID}-error`}>
          {props.error}
        </Text>
      ) : null}
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.selectOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
          testID={`${props.testID}-overlay`}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(event) => event.stopPropagation()}
            style={styles.selectSheet}
            testID={`${props.testID}-sheet`}
          >
            <Text style={styles.selectSheetTitle}>{props.label}</Text>
            <ScrollView
              contentContainerStyle={styles.selectSheetOptions}
              showsVerticalScrollIndicator={false}
            >
              {props.options.map((option) => {
                const active = option.value === props.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.selectOptionRow,
                      active && styles.selectOptionRowActive,
                    ]}
                    onPress={() => {
                      props.onChange(option.value);
                      setOpen(false);
                    }}
                    testID={`${props.testID}-option-${option.value}`}
                  >
                    <View style={styles.selectOptionTextWrap}>
                      <Text
                        style={[
                          styles.selectOptionLabel,
                          active && styles.selectOptionLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {option.meta ? (
                        <Text
                          style={[
                            styles.selectOptionMeta,
                            active && styles.selectOptionMetaActive,
                          ]}
                        >
                          {option.meta}
                        </Text>
                      ) : null}
                    </View>
                    {active ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.warmAccent}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function FormActions(props: {
  submitLabel: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  testIDPrefix: string;
}) {
  return (
    <View style={styles.formActions}>
      <TouchableOpacity
        style={styles.secondaryAction}
        onPress={props.onCancel}
        testID={`${props.testIDPrefix}-cancel`}
      >
        <Text style={styles.secondaryActionLabel}>Annuler</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.primaryAction,
          (props.isSubmitting || props.submitDisabled) &&
            styles.primaryActionDisabled,
        ]}
        disabled={props.isSubmitting || props.submitDisabled}
        onPress={props.onSubmit}
        testID={`${props.testIDPrefix}-submit`}
      >
        <Text style={styles.primaryActionLabel}>
          {props.isSubmitting ? "Enregistrement..." : props.submitLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function TeacherCreateFormSheet(props: {
  visible: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (
    values: z.infer<typeof teacherCreateFormSchema>,
  ) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof teacherCreateFormSchema>>({
    resolver: zodResolver(teacherCreateFormSchema),
    mode: "onChange",
    defaultValues: {
      mode: "phone",
      phone: "",
      pin: "",
      email: "",
      password: "",
    },
  });

  const mode = watch("mode");

  useEffect(() => {
    if (!props.visible) return;
    reset({
      mode: "phone",
      phone: "",
      pin: "",
      email: "",
      password: "",
    });
  }, [props.visible, reset]);

  return (
    <ModalFrame
      visible={props.visible}
      title="Créer un enseignant"
      eyebrow="Compte établissement"
      subtitle="Téléphone + PIN ou email + mot de passe initial."
      onClose={props.onClose}
      testID="teachers-admin-create-sheet"
      footer={
        <FormActions
          submitLabel="Ajouter l'enseignant"
          isSubmitting={props.isSubmitting}
          onCancel={props.onClose}
          onSubmit={handleSubmit(props.onSubmit, (errs) => {
            const first = Object.keys(errs)[0];
            if (first) focusField(first as Parameters<typeof focusField>[0]);
          })}
          testIDPrefix="teachers-admin-create"
        />
      }
    >
      <Controller
        control={control}
        name="mode"
        render={({ field: { value, onChange } }) => (
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Mode de création</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[
                  styles.modeChip,
                  value === "phone" && styles.modeChipActive,
                ]}
                onPress={() => onChange("phone")}
                testID="teachers-admin-create-mode-phone"
              >
                <Text
                  style={[
                    styles.modeChipLabel,
                    value === "phone" && styles.modeChipLabelActive,
                  ]}
                >
                  Téléphone + PIN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeChip,
                  value === "email" && styles.modeChipActive,
                ]}
                onPress={() => onChange("email")}
                testID="teachers-admin-create-mode-email"
              >
                <Text
                  style={[
                    styles.modeChipLabel,
                    value === "email" && styles.modeChipLabelActive,
                  ]}
                >
                  Email + mot de passe
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {mode === "phone" ? (
        <>
          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <TextFormField
                ref={ref}
                label="Téléphone"
                value={value ?? ""}
                onChangeText={(next) => onChange(normalizePhoneInput(next))}
                onBlur={onBlur}
                placeholder="699001122"
                error={errors.phone?.message}
                testID="teachers-admin-create-phone"
                keyboardType="numeric"
              />
            )}
          />
          <Controller
            control={control}
            name="pin"
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <TextFormField
                ref={ref}
                label="PIN initial"
                value={value ?? ""}
                onChangeText={(next) =>
                  onChange(next.replace(/\D/g, "").slice(0, 6))
                }
                onBlur={onBlur}
                placeholder="123456"
                error={errors.pin?.message}
                testID="teachers-admin-create-pin"
                keyboardType="numeric"
                secureTextEntry
              />
            )}
          />
        </>
      ) : (
        <>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <TextFormField
                ref={ref}
                label="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="enseignant@ecole.com"
                error={errors.email?.message}
                testID="teachers-admin-create-email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <TextFormField
                ref={ref}
                label="Mot de passe initial"
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="MotDePasse123"
                error={errors.password?.message}
                testID="teachers-admin-create-password"
                autoCapitalize="none"
                secureTextEntry
              />
            )}
          />
        </>
      )}
    </ModalFrame>
  );
}

function AssignmentFormSheet(props: {
  visible: boolean;
  mode: "create" | "edit";
  item: TeacherAssignmentRow | null;
  isSubmitting?: boolean;
  teacherOptions: TeacherRow[];
  schoolYears: TeacherSchoolYearOption[];
  classrooms: TeacherClassroomOption[];
  subjects: TeacherSubjectOption[];
  onClose: () => void;
  onSubmit: (
    values: z.infer<typeof teacherAssignmentFormSchema>,
  ) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof teacherAssignmentFormSchema>>({
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

  useEffect(() => {
    if (!props.visible) return;
    const activeSchoolYear =
      props.schoolYears.find((entry) => entry.isActive) ?? props.schoolYears[0];
    reset({
      schoolYearId: props.item?.schoolYearId ?? activeSchoolYear?.id ?? "",
      teacherUserId:
        props.item?.teacherUserId ?? props.teacherOptions[0]?.userId ?? "",
      classId: props.item?.classId ?? "",
      subjectId: props.item?.subjectId ?? props.subjects[0]?.id ?? "",
    });
  }, [
    props.item,
    props.schoolYears,
    props.subjects,
    props.teacherOptions,
    props.visible,
    reset,
  ]);

  const teacherOptions = useMemo(
    () =>
      props.teacherOptions.map((entry) => ({
        value: entry.userId,
        label: fullTeacherName(entry),
        meta: entry.email ?? (toLocalPhoneDisplay(entry.phone) || undefined),
      })),
    [props.teacherOptions],
  );

  const schoolYearOptions = useMemo(
    () =>
      props.schoolYears.map((entry) => ({
        value: entry.id,
        label: entry.label,
        meta: entry.isActive ? "Année active" : undefined,
      })),
    [props.schoolYears],
  );

  const classOptions = useMemo(
    () =>
      props.classrooms
        .filter(
          (entry) => !schoolYearId || entry.schoolYear.id === schoolYearId,
        )
        .map((entry) => ({
          value: entry.id,
          label: entry.name,
          meta: entry.schoolYear.label,
        })),
    [props.classrooms, schoolYearId],
  );

  const subjectOptions = useMemo(
    () =>
      props.subjects.map((entry) => ({
        value: entry.id,
        label: entry.name,
      })),
    [props.subjects],
  );

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
      testID="teachers-admin-assignment-sheet"
      footer={
        <FormActions
          submitLabel={
            props.mode === "create" ? "Créer l'affectation" : "Enregistrer"
          }
          isSubmitting={props.isSubmitting}
          onCancel={props.onClose}
          onSubmit={handleSubmit(props.onSubmit, (errs) => {
            const first = Object.keys(errs)[0];
            if (first) focusField(first as Parameters<typeof focusField>[0]);
          })}
          testIDPrefix="teachers-admin-assignment"
        />
      }
    >
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
            testID="teachers-admin-assignment-school-year"
          />
        )}
      />
      <Controller
        control={control}
        name="teacherUserId"
        render={({ field: { value, onChange } }) => (
          <CompactSelectField
            label="Enseignant"
            value={value}
            options={teacherOptions}
            placeholder="Choisir un enseignant"
            onChange={onChange}
            error={errors.teacherUserId?.message}
            testID="teachers-admin-assignment-teacher"
          />
        )}
      />
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
            testID="teachers-admin-assignment-class"
          />
        )}
      />
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
            testID="teachers-admin-assignment-subject"
          />
        )}
      />
    </ModalFrame>
  );
}

export function TeachersAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { schoolSlug, user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [tab, setTab] = useState<TabKey>("teachers");
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [schoolYears, setSchoolYears] = useState<TeacherSchoolYearOption[]>([]);
  const [classrooms, setClassrooms] = useState<TeacherClassroomOption[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubjectOption[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [teacherQuery, setTeacherQuery] = useState("");
  const [assignmentQuery, setAssignmentQuery] = useState("");
  const [teacherVisibleCount, setTeacherVisibleCount] = useState(PAGE_SIZE);
  const [assignmentVisibleCount, setAssignmentVisibleCount] =
    useState(PAGE_SIZE);
  const [expandedTeacherIds, setExpandedTeacherIds] = useState<string[]>([]);
  const [teacherSheet, setTeacherSheet] = useState<TeacherSheetState>({
    visible: false,
  });
  const [assignmentSheet, setAssignmentSheet] = useState<AssignmentSheetState>({
    visible: false,
    mode: "create",
    item: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<TeacherAssignmentRow | null>(
    null,
  );
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState(false);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);

  const effectiveRole = user?.activeRole ?? user?.role ?? null;
  const subtitle = user ? buildAdminSubtitle(user) : null;
  const canAccessModule = roleAllowsAdmin(effectiveRole);

  const teacherCountLabel = `${teachers.length} enseignant${teachers.length > 1 ? "s" : ""}`;
  const assignmentCountLabel = `${assignments.length} affectation${assignments.length > 1 ? "s" : ""}`;

  const filteredTeachers = useMemo(() => {
    const query = teacherQuery.trim().toLowerCase();
    const rows = [...teachers].sort((a, b) =>
      fullTeacherName(a).localeCompare(fullTeacherName(b)),
    );
    if (!query) return rows;
    return rows.filter((entry) => teacherSearchText(entry).includes(query));
  }, [teacherQuery, teachers]);

  const filteredAssignments = useMemo(() => {
    const query = assignmentQuery.trim().toLowerCase();
    const rows = [...assignments].sort((a, b) =>
      assignmentLabel(a).localeCompare(assignmentLabel(b)),
    );
    if (!query) return rows;
    return rows.filter((entry) => assignmentSearchText(entry).includes(query));
  }, [assignmentQuery, assignments]);

  const visibleTeachers = useMemo(
    () => filteredTeachers.slice(0, teacherVisibleCount),
    [filteredTeachers, teacherVisibleCount],
  );
  const visibleAssignments = useMemo(
    () => filteredAssignments.slice(0, assignmentVisibleCount),
    [assignmentVisibleCount, filteredAssignments],
  );
  const assignmentsByTeacher = useMemo(() => {
    const map = new Map<string, TeacherAssignmentRow[]>();
    for (const assignment of assignments) {
      const current = map.get(assignment.teacherUserId) ?? [];
      current.push(assignment);
      map.set(assignment.teacherUserId, current);
    }
    for (const [teacherUserId, rows] of map.entries()) {
      map.set(
        teacherUserId,
        [...rows].sort((a, b) =>
          `${a.schoolYear.label} ${a.class.name} ${a.subject.name}`.localeCompare(
            `${b.schoolYear.label} ${b.class.name} ${b.subject.name}`,
          ),
        ),
      );
    }
    return map;
  }, [assignments]);

  useEffect(() => {
    setTeacherVisibleCount(PAGE_SIZE);
  }, [teacherQuery, teachers.length]);

  useEffect(() => {
    setExpandedTeacherIds((current) =>
      current.filter((teacherId) =>
        teachers.some((teacher) => teacher.userId === teacherId),
      ),
    );
  }, [teachers]);

  useEffect(() => {
    setAssignmentVisibleCount(PAGE_SIZE);
  }, [assignmentQuery, assignments.length]);

  const loadModuleData = useCallback(
    async (refresh = false) => {
      if (!schoolSlug) {
        setErrorMessage("Aucun établissement actif.");
        setIsLoading(false);
        return;
      }
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);
      try {
        const [
          teacherRows,
          schoolYearRows,
          classroomRows,
          subjectRows,
          assignmentRows,
        ] = await Promise.all([
          teachersApi.listTeachers(schoolSlug),
          teachersApi.listSchoolYears(schoolSlug),
          teachersApi.listClassrooms(schoolSlug),
          teachersApi.listSubjects(schoolSlug),
          teachersApi.listAssignments(schoolSlug),
        ]);
        setTeachers(teacherRows);
        setSchoolYears(schoolYearRows);
        setClassrooms(classroomRows);
        setSubjects(subjectRows);
        setAssignments(assignmentRows);
      } catch (error) {
        setErrorMessage(extractApiError(error));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [schoolSlug],
  );

  useEffect(() => {
    if (!canAccessModule) return;
    void loadModuleData(false);
  }, [canAccessModule, loadModuleData]);

  const handleRefresh = useCallback(async () => {
    await loadModuleData(true);
  }, [loadModuleData]);

  async function handleCreateTeacher(
    values: z.infer<typeof teacherCreateFormSchema>,
  ) {
    if (!schoolSlug) return;
    setIsSubmittingTeacher(true);
    try {
      await teachersApi.createTeacher(schoolSlug, buildTeacherPayload(values));
      setTeacherSheet({ visible: false });
      await loadModuleData(true);
      showSuccess({
        title: "Enseignant ajouté",
        message:
          values.mode === "phone"
            ? "Le compte enseignant est prêt avec activation par PIN."
            : "Le compte enseignant a été créé avec un mot de passe initial.",
      });
    } catch (error) {
      const message = extractApiError(error);
      showError({
        title: "Création impossible",
        message,
      });
    } finally {
      setIsSubmittingTeacher(false);
    }
  }

  async function handleSubmitAssignment(
    values: z.infer<typeof teacherAssignmentFormSchema>,
  ) {
    if (!schoolSlug) return;
    const payload: TeacherAssignmentPayload = {
      schoolYearId: values.schoolYearId,
      teacherUserId: values.teacherUserId,
      classId: values.classId,
      subjectId: values.subjectId,
    };
    setIsSubmittingAssignment(true);
    try {
      if (assignmentSheet.mode === "create") {
        await teachersApi.createAssignment(schoolSlug, payload);
      } else if (assignmentSheet.item?.id) {
        await teachersApi.updateAssignment(
          schoolSlug,
          assignmentSheet.item.id,
          payload,
        );
      }
      setAssignmentSheet({
        visible: false,
        mode: "create",
        item: null,
      });
      await loadModuleData(true);
      showSuccess({
        title:
          assignmentSheet.mode === "create"
            ? "Affectation créée"
            : "Affectation mise à jour",
        message:
          assignmentSheet.mode === "create"
            ? "La liaison enseignant, classe et matière a été enregistrée."
            : "Les changements sur l'affectation ont été enregistrés.",
      });
    } catch (error) {
      showError({
        title: "Opération impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsSubmittingAssignment(false);
    }
  }

  async function handleDeleteAssignment() {
    if (!schoolSlug || !deleteTarget) return;
    setIsDeletingAssignment(true);
    try {
      await teachersApi.deleteAssignment(schoolSlug, deleteTarget.id);
      setDeleteTarget(null);
      await loadModuleData(true);
      showSuccess({
        title: "Affectation supprimée",
        message: "L'affectation a été retirée de l'organisation pédagogique.",
      });
    } catch (error) {
      showError({
        title: "Suppression impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsDeletingAssignment(false);
    }
  }

  function openFab() {
    if (tab === "teachers") {
      setTeacherSheet({ visible: true });
      return;
    }
    if (tab === "assignments") {
      setAssignmentSheet({
        visible: true,
        mode: "create",
        item: null,
      });
    }
  }

  function toggleTeacherExpansion(teacherUserId: string) {
    setExpandedTeacherIds((current) =>
      current.includes(teacherUserId)
        ? current.filter((entry) => entry !== teacherUserId)
        : [...current, teacherUserId],
    );
  }

  if (!user) {
    return (
      <View style={styles.screen}>
        <LoadingBlock label="Chargement du profil..." />
      </View>
    );
  }

  if (!canAccessModule) {
    return (
      <View style={styles.screen}>
        <ModuleHeader
          title="Enseignants"
          subtitle={getPortalLabel(getViewType(user))}
          onBack={() => router.back()}
          rightIcon="menu-outline"
          onRightPress={openDrawer}
          topInset={insets.top}
          testID="teachers-admin-header"
          backTestID="teachers-admin-back-btn"
          rightTestID="teachers-admin-menu-btn"
        />
        <View style={styles.lockedWrap}>
          <EmptyState
            icon="school-outline"
            title="Module réservé aux comptes admin"
            message="Ce module mobile est disponible pour les comptes school admin."
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ModuleHeader
        title="Enseignants"
        subtitle={subtitle}
        onBack={() => router.back()}
        rightIcon="menu-outline"
        onRightPress={openDrawer}
        topInset={insets.top}
        testID="teachers-admin-header"
        backTestID="teachers-admin-back-btn"
        rightTestID="teachers-admin-menu-btn"
      />

      <UnderlineTabs
        items={[...TAB_ITEMS]}
        activeKey={tab}
        onSelect={setTab}
        testIDPrefix="teachers-admin-tab"
      />

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <LoadingBlock label="Chargement du module enseignants..." />
        </View>
      ) : (
        <View style={styles.content}>
          {errorMessage ? (
            <ErrorBanner
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
              testID="teachers-admin-error-banner"
            />
          ) : null}

          <View
            style={styles.summaryStrip}
            testID="teachers-admin-summary-card"
          >
            <View style={styles.summaryStatChip}>
              <Ionicons
                name="people-outline"
                size={14}
                color={colors.accentTeal}
              />
              <Text
                style={styles.summaryStatText}
                testID="teachers-admin-summary-text"
              >
                {teacherCountLabel}
              </Text>
            </View>
            <View style={styles.summaryStatChip}>
              <Ionicons
                name="layers-outline"
                size={14}
                color={colors.accentTeal}
              />
              <Text style={styles.summaryStatText}>{assignmentCountLabel}</Text>
            </View>
          </View>

          {tab === "teachers" ? (
            <InfiniteScrollList
              data={visibleTeachers}
              keyExtractor={(item) => item.userId}
              renderItem={({ item, index }) => {
                const teacherAssignments =
                  assignmentsByTeacher.get(item.userId) ?? [];
                const hasAssignments = teacherAssignments.length > 0;
                const isExpanded = expandedTeacherIds.includes(item.userId);
                return (
                  <View
                    style={[
                      styles.entityRow,
                      {
                        backgroundColor:
                          index % 2 === 0 ? "#FFF9F3" : "#FFF2E4",
                      },
                    ]}
                    testID={`teachers-admin-teacher-row-${item.userId}`}
                  >
                    <View
                      style={[
                        styles.entityAccent,
                        { backgroundColor: "#D89B5B" },
                      ]}
                    />
                    <View style={styles.entityMain}>
                      <View
                        style={styles.entityTextWrap}
                        testID={`teachers-admin-teacher-identity-${item.userId}`}
                      >
                        <View style={styles.teacherNameRow}>
                          <Text style={styles.entityTitle}>
                            {fullTeacherName(item)}
                          </Text>
                          <Text
                            style={styles.teacherContactInline}
                            testID={`teachers-admin-teacher-contact-${item.userId}`}
                            numberOfLines={1}
                          >
                            {formatTeacherContact(item)}
                          </Text>
                        </View>
                        {hasAssignments ? (
                          <Text
                            style={styles.teacherClassesSummary}
                            testID={`teachers-admin-teacher-classes-summary-${item.userId}`}
                          >
                            {summarizeTeacherClasses(teacherAssignments)}
                          </Text>
                        ) : (
                          <Text
                            style={styles.noAssignmentText}
                            testID={`teachers-admin-teacher-classes-summary-${item.userId}`}
                          >
                            Non affecté
                          </Text>
                        )}
                      </View>
                      {isExpanded ? (
                        <View
                          style={styles.teacherAssignmentsInline}
                          testID={`teachers-admin-teacher-assignments-${item.userId}`}
                        >
                          {teacherAssignments.length === 0 ? (
                            <Text
                              style={styles.teacherAssignmentsEmpty}
                              testID={`teachers-admin-teacher-assignments-empty-${item.userId}`}
                            >
                              Aucun créneau pédagogique.
                            </Text>
                          ) : (
                            teacherAssignments.map((assignment) => (
                              <View
                                key={assignment.id}
                                style={styles.teacherAssignmentInlineRow}
                                testID={`teachers-admin-teacher-inline-assignment-${assignment.id}`}
                              >
                                <View
                                  style={styles.teacherAssignmentInlineText}
                                >
                                  <Text
                                    style={styles.teacherAssignmentInlineTitle}
                                  >
                                    {assignment.schoolYear.label}
                                  </Text>
                                  <Text
                                    style={styles.teacherAssignmentInlineMeta}
                                  >
                                    {assignment.class.name} ·{" "}
                                    {assignment.subject.name}
                                  </Text>
                                </View>
                                <View style={styles.iconActions}>
                                  <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() =>
                                      setAssignmentSheet({
                                        visible: true,
                                        mode: "edit",
                                        item: assignment,
                                      })
                                    }
                                    testID={`teachers-admin-assignment-edit-${assignment.id}`}
                                  >
                                    <Ionicons
                                      name="create-outline"
                                      size={18}
                                      color={colors.primary}
                                    />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => setDeleteTarget(assignment)}
                                    testID={`teachers-admin-assignment-delete-${assignment.id}`}
                                  >
                                    <Ionicons
                                      name="trash-outline"
                                      size={18}
                                      color={colors.notification}
                                    />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ))
                          )}
                        </View>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => toggleTeacherExpansion(item.userId)}
                      testID={`teachers-admin-teacher-open-assignments-${item.userId}`}
                    >
                      <Ionicons
                        name={isExpanded ? "eye-off-outline" : "eye-outline"}
                        size={16}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                );
              }}
              onRefresh={handleRefresh}
              refreshing={isRefreshing}
              onLoadMore={() =>
                setTeacherVisibleCount((current) => current + PAGE_SIZE)
              }
              hasMore={visibleTeachers.length < filteredTeachers.length}
              isLoadingMore={false}
              testID="teachers-admin-teachers-list"
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <View style={styles.listHeader}>
                  <TextInput
                    value={teacherQuery}
                    onChangeText={setTeacherQuery}
                    placeholder="Rechercher un enseignant"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.searchInput}
                    testID="teachers-admin-teachers-search"
                  />
                </View>
              }
              emptyComponent={
                <View style={styles.emptyListWrap}>
                  <EmptyState
                    icon="school-outline"
                    title={
                      teacherQuery.trim()
                        ? "Aucun enseignant trouvé"
                        : "Aucun enseignant"
                    }
                    message={
                      teacherQuery.trim()
                        ? "Ajustez votre recherche pour retrouver un enseignant."
                        : "Ajoutez un premier enseignant depuis le bouton flottant."
                    }
                  />
                </View>
              }
            />
          ) : null}

          {tab === "assignments" ? (
            <InfiniteScrollList
              data={visibleAssignments}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.entityRow,
                    {
                      backgroundColor: index % 2 === 0 ? "#F4FCFA" : "#EAF7F4",
                    },
                  ]}
                  testID={`teachers-admin-assignment-row-${item.id}`}
                >
                  <View
                    style={[
                      styles.entityAccent,
                      { backgroundColor: "#247C72" },
                    ]}
                  />
                  <View style={styles.entityMain}>
                    <View style={styles.entityTextWrap}>
                      <Text style={styles.entityTitle}>
                        {assignmentLabel(item)}
                      </Text>
                      <Text style={styles.entityMeta}>
                        {fullTeacherName(item.teacherUser)} ·{" "}
                        {item.schoolYear.label}
                      </Text>
                      <Text style={styles.entityMeta}>
                        Créée {formatDateTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.iconActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() =>
                        setAssignmentSheet({
                          visible: true,
                          mode: "edit",
                          item,
                        })
                      }
                      testID={`teachers-admin-assignment-edit-${item.id}`}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => setDeleteTarget(item)}
                      testID={`teachers-admin-assignment-delete-${item.id}`}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.notification}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              onRefresh={handleRefresh}
              refreshing={isRefreshing}
              onLoadMore={() =>
                setAssignmentVisibleCount((current) => current + PAGE_SIZE)
              }
              hasMore={visibleAssignments.length < filteredAssignments.length}
              isLoadingMore={false}
              testID="teachers-admin-assignments-list"
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <View style={styles.listHeader}>
                  <TextInput
                    value={assignmentQuery}
                    onChangeText={setAssignmentQuery}
                    placeholder="Rechercher une affectation"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.searchInput}
                    testID="teachers-admin-assignments-search"
                  />
                </View>
              }
              emptyComponent={
                <View style={styles.emptyListWrap}>
                  <EmptyState
                    icon="layers-outline"
                    title={
                      assignmentQuery.trim()
                        ? "Aucune affectation trouvée"
                        : "Aucune affectation"
                    }
                    message={
                      assignmentQuery.trim()
                        ? "Ajustez votre recherche pour retrouver une affectation."
                        : "Créez une première affectation depuis le bouton flottant."
                    }
                  />
                </View>
              }
            />
          ) : null}

          {tab === "help" ? (
            <ScrollView
              style={styles.helpScroll}
              contentContainerStyle={styles.helpContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => {
                    void handleRefresh();
                  }}
                />
              }
              showsVerticalScrollIndicator={false}
              testID="teachers-admin-help-scroll"
            >
              <SectionCard
                title="Parcours recommandé"
                testID="teachers-admin-help-card"
              >
                <Text style={styles.helpLine}>
                  1. Créez ou rattachez d'abord les comptes enseignants.
                </Text>
                <Text style={styles.helpLine}>
                  2. Ajoutez ensuite les affectations classe / matière / année.
                </Text>
                <Text style={styles.helpLine}>
                  3. Utilisez la recherche pour retrouver rapidement un profil
                  ou une affectation.
                </Text>
              </SectionCard>
              <SectionCard title="Rappels métier">
                <Text style={styles.helpLine}>
                  Un enseignant peut être créé par téléphone + PIN ou par email
                  + mot de passe initial.
                </Text>
                <Text style={styles.helpLine}>
                  Les affectations doivent respecter l'année scolaire et la
                  classe associée.
                </Text>
                <Text style={styles.helpLine}>
                  Toute erreur backend ou validation zod remonte dans les toasts
                  et les formulaires.
                </Text>
              </SectionCard>
            </ScrollView>
          ) : null}
        </View>
      )}

      {tab !== "help" ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={openFab}
          testID="teachers-admin-fab"
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      <TeacherCreateFormSheet
        visible={teacherSheet.visible}
        isSubmitting={isSubmittingTeacher}
        onClose={() => setTeacherSheet({ visible: false })}
        onSubmit={handleCreateTeacher}
      />

      <AssignmentFormSheet
        visible={assignmentSheet.visible}
        mode={assignmentSheet.mode}
        item={assignmentSheet.item}
        isSubmitting={isSubmittingAssignment}
        teacherOptions={teachers}
        schoolYears={schoolYears}
        classrooms={classrooms}
        subjects={subjects}
        onClose={() =>
          setAssignmentSheet({
            visible: false,
            mode: "create",
            item: null,
          })
        }
        onSubmit={handleSubmitAssignment}
      />

      <ConfirmDialog
        visible={deleteTarget != null}
        title="Supprimer l'affectation"
        message={
          deleteTarget
            ? `Retirer ${assignmentLabel(deleteTarget)} pour ${fullTeacherName(deleteTarget.teacherUser)} ?`
            : ""
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onCancel={() => {
          if (!isDeletingAssignment) setDeleteTarget(null);
        }}
        onConfirm={() => {
          void handleDeleteAssignment();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  lockedWrap: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  loadingWrap: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  summaryStrip: {
    flexDirection: "row",
    gap: 10,
  },
  summaryStatChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAF7F4",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  summaryStatText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accentTeal,
  },
  listContent: {
    paddingBottom: 108,
    gap: 8,
  },
  listHeader: {
    paddingTop: 2,
    paddingBottom: 4,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.textPrimary,
    fontSize: 14,
  },
  emptyListWrap: {
    paddingTop: 36,
  },
  entityRow: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 14,
    padding: 14,
    paddingLeft: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    shadowColor: "#08467D",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  entityAccent: {
    position: "absolute",
    left: 0,
    top: 10,
    bottom: 10,
    width: 4,
    borderRadius: 999,
  },
  entityMain: {
    flex: 1,
    gap: 6,
  },
  entityTextWrap: {
    gap: 2,
  },
  entityTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  entityMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  iconActions: {
    flexDirection: "row",
    gap: 6,
  },
  teacherNameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "nowrap",
  },
  teacherContactInline: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  teacherClassesSummary: {
    color: colors.accentTealDark,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  noAssignmentText: {
    fontSize: 11,
    color: colors.notification,
    fontWeight: "600",
  },
  teacherAssignmentsInline: {
    borderTopWidth: 1,
    borderTopColor: "#08467D12",
    paddingTop: 10,
    gap: 8,
    marginTop: 4,
  },
  teacherAssignmentsEmpty: {
    color: colors.notification,
    fontSize: 11,
    lineHeight: 16,
  },
  teacherAssignmentInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#FFFFFFB8",
  },
  teacherAssignmentInlineText: {
    flex: 1,
    gap: 3,
  },
  teacherAssignmentInlineTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  teacherAssignmentInlineMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFFFFFE0",
    alignItems: "center",
    justifyContent: "center",
  },
  helpScroll: {
    flex: 1,
  },
  helpContent: {
    paddingBottom: 108,
    gap: 12,
  },
  helpLine: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 20, 34, 0.28)",
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheetKeyboard: {
    justifyContent: "flex-end",
    maxHeight: "88%",
    flexShrink: 1,
  },
  sheetCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  sheetHeader: {
    backgroundColor: colors.primary,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  sheetHeaderText: {
    flex: 1,
    gap: 3,
  },
  sheetEyebrow: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sheetTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
  },
  sheetSubtitle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  sheetScrollArea: {
    flex: 1,
  },
  sheetBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 14,
  },
  sheetFooter: {
    backgroundColor: colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 20,
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
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
  },
  formInputFocused: {
    borderColor: colors.primary,
  },
  formInputError: {
    borderColor: "#B84A3B",
  },
  formError: {
    color: "#B84A3B",
    fontSize: 12,
    lineHeight: 16,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeChip: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modeChipActive: {
    borderColor: colors.primary,
    backgroundColor: "#EEF5FB",
  },
  modeChipLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  modeChipLabelActive: {
    color: colors.primary,
  },
  compactSelectTrigger: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  compactSelectTriggerError: {
    borderColor: "#B84A3B",
  },
  compactSelectTextWrap: {
    flex: 1,
    gap: 3,
  },
  compactSelectValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  compactSelectMeta: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  selectOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 20, 34, 0.28)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  selectSheet: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxHeight: "72%",
  },
  selectSheetTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  selectSheetOptions: {
    gap: 8,
  },
  selectOptionRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  selectOptionRowActive: {
    borderColor: colors.primary,
    backgroundColor: "#F1F7FC",
  },
  selectOptionTextWrap: {
    flex: 1,
    gap: 2,
  },
  selectOptionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  selectOptionLabelActive: {
    color: colors.primary,
  },
  selectOptionMeta: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  selectOptionMetaActive: {
    color: colors.primary,
  },
  formActions: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  secondaryActionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  primaryAction: {
    flex: 1.2,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  primaryActionDisabled: {
    opacity: 0.5,
  },
  primaryActionLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
