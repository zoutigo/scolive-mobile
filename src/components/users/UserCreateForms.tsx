import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { familyApi, type AdminStudentRow } from "../../api/family.api";
import {
  CompactSelectField,
  FormActions,
  TextFormField,
} from "../teachers/TeacherSheetCommons";
import { SecureTextField } from "../SecureTextField";
import {
  normalizePhoneInput,
  PASSWORD_COMPLEXITY_REGEX,
} from "../account/account.schemas";
import type { TeacherClassroomOption } from "../../types/teachers.types";
import type { StaffFunctionOption } from "../../api/staff-functions.api";
import type { CreatableStaffRole } from "../../api/users.api";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const contactModeShape = {
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
};

function refineContactMode(
  value: {
    mode: "phone" | "email";
    phone?: string;
    pin?: string;
    email: string;
    password?: string;
  },
  ctx: z.RefinementCtx,
) {
  if (value.mode === "phone") {
    if (!(value.phone ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Le téléphone est obligatoire.",
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
        message: "L'email est obligatoire.",
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
}

export const parentCreateFormSchema = z
  .object({
    ...contactModeShape,
    studentId: z.string().trim().min(1, "L'élève est obligatoire."),
  })
  .superRefine(refineContactMode);

export const contactOnlyCreateFormSchema = z
  .object({ ...contactModeShape })
  .superRefine(refineContactMode);

export type ContactOnlyCreateFormValues = z.infer<
  typeof contactOnlyCreateFormSchema
>;

export const staffCreateFormSchema = z
  .object({
    ...contactModeShape,
    functionId: z.string().trim().optional(),
  })
  .superRefine(refineContactMode);

export const studentCreateFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "Le prénom est obligatoire."),
    lastName: z.string().trim().min(1, "Le nom est obligatoire."),
    levelId: z.string().trim().min(1, "Le niveau est obligatoire."),
    classId: z.string().trim().min(1, "La classe est obligatoire."),
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
    const hasEmail = Boolean(value.email.trim());
    const hasPassword = Boolean((value.password ?? "").trim());
    if (hasEmail && !hasPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Mot de passe requis si un email est fourni.",
      });
    }
    if (hasPassword && !hasEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Email requis si un mot de passe est fourni.",
      });
    }
  });

export type ContactModeFormValues = z.infer<
  z.ZodObject<typeof contactModeShape>
>;
export type ParentCreateFormValues = z.infer<typeof parentCreateFormSchema>;
export type StaffCreateFormValues = z.infer<typeof staffCreateFormSchema>;
export type StudentCreateFormValues = z.infer<typeof studentCreateFormSchema>;

// ---------------------------------------------------------------------------
// ContactModeFields — bloc partagé mode téléphone+PIN / email+mot de passe
// ---------------------------------------------------------------------------

export function ContactModeFields<
  TFieldValues extends ContactModeFormValues,
>(props: {
  control: import("react-hook-form").Control<TFieldValues>;
  errors: Partial<
    Record<"phone" | "pin" | "email" | "password", { message?: string }>
  >;
  mode: "phone" | "email";
  testIDPrefix: string;
}) {
  const { t } = useTranslation();
  const { control, errors, mode, testIDPrefix } = props;

  return (
    <>
      <Controller
        control={control}
        name={"mode" as never}
        render={({ field: { value, onChange } }) => (
          <View style={styles.formField}>
            <Text style={styles.formLabel}>
              {t("users.create.contactMode.label")}
            </Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[
                  styles.modeChip,
                  value === "phone" && styles.modeChipActive,
                ]}
                onPress={() => onChange("phone")}
                testID={`${testIDPrefix}-mode-phone`}
              >
                <Text
                  style={[
                    styles.modeChipLabel,
                    value === "phone" && styles.modeChipLabelActive,
                  ]}
                >
                  {t("users.create.contactMode.phone")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeChip,
                  value === "email" && styles.modeChipActive,
                ]}
                onPress={() => onChange("email")}
                testID={`${testIDPrefix}-mode-email`}
              >
                <Text
                  style={[
                    styles.modeChipLabel,
                    value === "email" && styles.modeChipLabelActive,
                  ]}
                >
                  {t("users.create.contactMode.email")}
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
            name={"phone" as never}
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <TextFormField
                ref={ref}
                label={t("users.create.field.phone.label")}
                value={value ?? ""}
                onChangeText={(next) => onChange(normalizePhoneInput(next))}
                onBlur={onBlur}
                placeholder={t("users.create.field.phone.placeholder")}
                error={errors.phone?.message}
                testID={`${testIDPrefix}-phone`}
                keyboardType="numeric"
              />
            )}
          />
          <Controller
            control={control}
            name={"pin" as never}
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  {t("users.create.field.pin.label")}
                </Text>
                <SecureTextField
                  ref={ref}
                  value={value ?? ""}
                  onChangeText={(next: string) =>
                    onChange(next.replace(/\D/g, "").slice(0, 6))
                  }
                  onBlur={onBlur}
                  placeholder={t("users.create.field.pin.placeholder")}
                  hasError={!!errors.pin}
                  testID={`${testIDPrefix}-pin`}
                  variant="pin"
                  keyboardType="numeric"
                  containerStyle={{ borderRadius: 6 }}
                />
                {errors.pin ? (
                  <Text
                    style={styles.formError}
                    testID={`${testIDPrefix}-pin-error`}
                  >
                    {errors.pin.message}
                  </Text>
                ) : null}
              </View>
            )}
          />
        </>
      ) : (
        <>
          <Controller
            control={control}
            name={"email" as never}
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <TextFormField
                ref={ref}
                label={t("users.create.field.email.label")}
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t("users.create.field.email.placeholder")}
                error={errors.email?.message}
                testID={`${testIDPrefix}-email`}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          <Controller
            control={control}
            name={"password" as never}
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  {t("users.create.field.password.label")}
                </Text>
                <SecureTextField
                  ref={ref}
                  value={value ?? ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t("users.create.field.password.placeholder")}
                  hasError={!!errors.password}
                  testID={`${testIDPrefix}-password`}
                  variant="password"
                  autoCapitalize="none"
                  containerStyle={{ borderRadius: 6 }}
                />
                {errors.password ? (
                  <Text
                    style={styles.formError}
                    testID={`${testIDPrefix}-password-error`}
                  >
                    {errors.password.message}
                  </Text>
                ) : null}
              </View>
            )}
          />
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// ParentCreateFormContent
// ---------------------------------------------------------------------------

function StudentPickerField(props: {
  schoolSlug: string;
  value: string;
  selectedLabel: string | null;
  onChange: (studentId: string, label: string) => void;
  error?: string;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminStudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    const timer = setTimeout(() => {
      familyApi
        .listAdminStudents(props.schoolSlug, { search: query })
        .then((page) => {
          if (active) setResults(page.students);
        })
        .catch(() => {
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, props.schoolSlug]);

  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>
        {t("users.create.field.student.label")}
      </Text>
      {props.selectedLabel ? (
        <View
          style={styles.studentSelectedChip}
          testID="users-create-parent-student-selected"
        >
          <Text style={styles.studentSelectedChipLabel}>
            {props.selectedLabel}
          </Text>
          <TouchableOpacity
            onPress={() => props.onChange("", "")}
            testID="users-create-parent-student-clear"
          >
            <Text style={styles.studentSelectedChipClear}>×</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("users.create.field.student.placeholder")}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.formInput,
              props.error ? styles.formInputError : null,
            ]}
            testID="users-create-parent-student-search"
          />
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.studentResultsList}>
              {results.map((student) => (
                <TouchableOpacity
                  key={student.id}
                  style={styles.studentResultRow}
                  onPress={() =>
                    props.onChange(
                      student.id,
                      `${student.lastName} ${student.firstName}`.trim(),
                    )
                  }
                  testID={`users-create-parent-student-option-${student.id}`}
                >
                  <Text style={styles.studentResultLabel}>
                    {student.lastName} {student.firstName}
                  </Text>
                  {student.currentEnrollment ? (
                    <Text style={styles.studentResultMeta}>
                      {student.currentEnrollment.class.name}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
              {!isLoading && results.length === 0 ? (
                <Text style={styles.formError}>
                  {t("users.create.field.student.noResults")}
                </Text>
              ) : null}
            </View>
          )}
        </>
      )}
      {props.error ? (
        <Text
          style={styles.formError}
          testID="users-create-parent-student-error"
        >
          {props.error}
        </Text>
      ) : null}
    </View>
  );
}

export function ParentCreateFormContent(props: {
  schoolSlug: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: ParentCreateFormValues) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<ParentCreateFormValues>({
    resolver: zodResolver(parentCreateFormSchema),
    mode: "onChange",
    defaultValues: {
      studentId: "",
      mode: "phone",
      phone: "",
      pin: "",
      email: "",
      password: "",
    },
  });

  const mode = watch("mode");
  const studentId = watch("studentId");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="users-create-parent-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StudentPickerField
          schoolSlug={props.schoolSlug}
          value={studentId}
          selectedLabel={selectedLabel}
          onChange={(id, label) => {
            setValue("studentId", id, { shouldValidate: true });
            setSelectedLabel(label || null);
          }}
          error={errors.studentId?.message}
        />
        <ContactModeFields
          control={control}
          errors={errors}
          mode={mode}
          testIDPrefix="users-create-parent"
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={t("users.create.submit.PARENT")}
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={handleSubmit(props.onSubmit, (errs) => {
            const first = Object.keys(errs)[0];
            if (first && first !== "studentId") {
              setFocus(first as Parameters<typeof setFocus>[0]);
            }
          })}
          testIDPrefix="users-create-parent"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// TeacherCreateFormContent
// ---------------------------------------------------------------------------

export function TeacherCreateFormContent(props: {
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: ContactOnlyCreateFormValues) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors },
  } = useForm<ContactOnlyCreateFormValues>({
    resolver: zodResolver(contactOnlyCreateFormSchema),
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="users-create-teacher-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ContactModeFields
          control={control}
          errors={errors}
          mode={mode}
          testIDPrefix="users-create-teacher"
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={t("users.create.submit.TEACHER")}
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={handleSubmit(props.onSubmit, (errs) => {
            const first = Object.keys(errs)[0];
            if (first) setFocus(first as Parameters<typeof setFocus>[0]);
          })}
          testIDPrefix="users-create-teacher"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// StaffCreateFormContent — SCHOOL_MANAGER / SUPERVISOR / SCHOOL_ACCOUNTANT / SCHOOL_STAFF
// ---------------------------------------------------------------------------

export function StaffCreateFormContent(props: {
  role: CreatableStaffRole;
  functionOptions: StaffFunctionOption[];
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: StaffCreateFormValues) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<StaffCreateFormValues>({
    resolver: zodResolver(staffCreateFormSchema),
    mode: "onChange",
    defaultValues: {
      mode: "phone",
      phone: "",
      pin: "",
      email: "",
      password: "",
      functionId: "",
    },
  });

  const mode = watch("mode");
  const functionId = watch("functionId") ?? "";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="users-create-staff-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ContactModeFields
          control={control}
          errors={errors}
          mode={mode}
          testIDPrefix="users-create-staff"
        />
        <CompactSelectField
          label={t("users.create.field.function.label")}
          value={functionId}
          options={props.functionOptions.map((fn) => ({
            value: fn.id,
            label: fn.name,
          }))}
          placeholder={t("users.create.field.function.placeholder")}
          onChange={(value) => setValue("functionId", value)}
          testID="users-create-staff-function"
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={t(`users.create.submit.${props.role}` as never)}
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={handleSubmit(props.onSubmit, (errs) => {
            const first = Object.keys(errs)[0];
            if (first) setFocus(first as Parameters<typeof setFocus>[0]);
          })}
          testIDPrefix="users-create-staff"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// StudentCreateFormContent
// ---------------------------------------------------------------------------

export function StudentCreateFormContent(props: {
  classrooms: TeacherClassroomOption[];
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: StudentCreateFormValues) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<StudentCreateFormValues>({
    resolver: zodResolver(studentCreateFormSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      levelId: "",
      classId: "",
      email: "",
      password: "",
    },
  });

  const levelId = watch("levelId");
  const classId = watch("classId");

  const levelOptions = Array.from(
    new Map(
      props.classrooms
        .filter((room) => room.academicLevel)
        .map((room) => [room.academicLevel!.id, room.academicLevel!.label]),
    ).entries(),
  ).map(([value, label]) => ({ value, label }));

  const classOptions = props.classrooms
    .filter((room) => !levelId || room.academicLevel?.id === levelId)
    .map((room) => ({ value: room.id, label: room.name }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="users-create-student-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="firstName"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label={t("users.create.field.firstName.label")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("users.create.field.firstName.placeholder")}
              error={errors.firstName?.message}
              testID="users-create-student-first-name"
            />
          )}
        />
        <Controller
          control={control}
          name="lastName"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label={t("users.create.field.lastName.label")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("users.create.field.lastName.placeholder")}
              error={errors.lastName?.message}
              testID="users-create-student-last-name"
            />
          )}
        />
        <CompactSelectField
          label={t("users.create.field.level.label")}
          value={levelId}
          options={levelOptions}
          placeholder={t("users.create.field.level.placeholder")}
          onChange={(value) => {
            setValue("levelId", value, { shouldValidate: true });
            if (
              classId &&
              !props.classrooms.some(
                (room) =>
                  room.id === classId && room.academicLevel?.id === value,
              )
            ) {
              setValue("classId", "", { shouldValidate: true });
            }
          }}
          error={errors.levelId?.message}
          testID="users-create-student-level"
        />
        <CompactSelectField
          label={t("users.create.field.class.label")}
          value={classId}
          options={classOptions}
          placeholder={t("users.create.field.class.placeholder")}
          onChange={(value) =>
            setValue("classId", value, { shouldValidate: true })
          }
          error={errors.classId?.message}
          testID="users-create-student-class"
        />

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionDividerLabel}>
            {t("users.create.field.access.sectionTitle")}
          </Text>
        </View>
        <Text style={styles.formHint}>
          {t("users.create.field.access.hint")}
        </Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label={t("users.create.field.email.label")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("users.create.field.email.placeholder")}
              error={errors.email?.message}
              testID="users-create-student-email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <View style={styles.formField}>
              <Text style={styles.formLabel}>
                {t("users.create.field.password.label")}
              </Text>
              <SecureTextField
                ref={ref}
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t("users.create.field.password.placeholder")}
                hasError={!!errors.password}
                testID="users-create-student-password"
                variant="password"
                autoCapitalize="none"
                containerStyle={{ borderRadius: 6 }}
              />
              {errors.password ? (
                <Text
                  style={styles.formError}
                  testID="users-create-student-password-error"
                >
                  {errors.password.message}
                </Text>
              ) : null}
            </View>
          )}
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={t("users.create.submit.STUDENT")}
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={handleSubmit(props.onSubmit, (errs) => {
            const first = Object.keys(errs)[0];
            if (first === "firstName" || first === "lastName") {
              setFocus(first);
            }
          })}
          testIDPrefix="users-create-student"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  formsKeyboardArea: { flex: 1 },
  formScroll: { flex: 1 },
  formScrollContent: {
    padding: 16,
    gap: 14,
  },
  formActionsBar: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
  },
  formField: { gap: 8 },
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
  formInputError: {
    borderColor: "#B84A3B",
  },
  formError: {
    color: "#B84A3B",
    fontSize: 12,
    lineHeight: 16,
  },
  formHint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: -6,
  },
  sectionDivider: {
    marginTop: 4,
  },
  sectionDividerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  modeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeChipLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  modeChipLabelActive: {
    color: colors.white,
  },
  studentSelectedChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#F1F7FC",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  studentSelectedChipLabel: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  studentSelectedChipClear: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 6,
  },
  studentResultsList: {
    gap: 6,
    marginTop: 4,
  },
  studentResultRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  studentResultLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  studentResultMeta: {
    color: colors.textSecondary,
    fontSize: 11,
  },
});
