import React, { useCallback, useEffect, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { colors } from "../../theme";
import { usersApi } from "../../api/users.api";
import { familyApi } from "../../api/family.api";
import { teachersApi } from "../../api/teachers.api";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { ROLE_LABELS, ROLE_COLORS } from "./UserCard";
import { FormActions } from "../teachers/TeacherSheetCommons";
import { InlineSelectDropDown } from "../InlineSelectDropDown";
import { FormHero } from "../forms/FormHero";
import { useScrollToFirstError } from "../../hooks/useScrollToFirstError";
import {
  teacherAssignmentFormSchema,
  type TeacherAssignmentFormValues,
} from "../teachers/TeacherAssignmentSheet";
import { PromoteToUserFormContent } from "./PromoteToUserSheet";
import { CredentialDisplaySheet } from "./CredentialDisplaySheet";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { extractApiError } from "../../utils/api-error";
import { useTranslation } from "../../i18n/useTranslation";
import {
  ContactModeFields,
  contactOnlyCreateFormSchema,
  type ContactOnlyCreateFormValues,
} from "./UserCreateForms";
import type {
  SchoolMember,
  SchoolUser,
  SchoolUserDetail,
  StudentOnlyDetail,
  SchoolRole,
  UserActivationStatus,
  SchoolUserTeachingClass,
  SchoolUserParent,
  SchoolUserStaffFunction,
  PromoteStudentResponse,
  UserItem,
} from "../../types/users.types";
import type {
  TeacherSchoolYearOption,
  TeacherClassroomOption,
  TeacherSubjectOption,
  TeacherAssignmentPayload,
} from "../../types/teachers.types";
import type { AdminStudentRow } from "../../api/family.api";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Un membre "user" (compte promu) référence l'élève d'origine via
// `studentId` (nullable si l'API ne l'a pas résolu) ; ne jamais retomber
// sur `id` (le User.id) sans passer par ce fallback, car les endpoints
// scopés élève (parent-students, reset-password, discipline, notes,
// agenda) attendent un Student.id, pas un User.id.
function resolveStudentId(member: SchoolMember): string {
  return member.type === "student-only"
    ? member.studentId
    : (member.studentId ?? member.id);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-CM", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-CM", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<
  UserActivationStatus,
  { label: string; color: string; icon: "checkmark-circle" | "time" | "ban" }
> = {
  ACTIVE: {
    label: "Actif",
    color: colors.accentTeal,
    icon: "checkmark-circle",
  },
  PENDING: { label: "En attente", color: colors.warmAccent, icon: "time" },
  SUSPENDED: { label: "Suspendu", color: colors.notification, icon: "ban" },
};

const GENDER_LABELS: Record<string, string> = {
  M: "Masculin",
  F: "Féminin",
  OTHER: "Autre",
};

const ROLE_SECTION_COLORS: Partial<
  Record<SchoolRole, { bg: string; border: string; icon: string }>
> = {
  TEACHER: { bg: "#E8F5F3", border: "#247C72", icon: "#247C72" },
  PARENT: { bg: "#FDF3E7", border: "#D89B5B", icon: "#D89B5B" },
  STUDENT: { bg: "#FEF0EB", border: "#B85C2E", icon: "#B85C2E" },
  SCHOOL_STAFF: { bg: "#F0EFED", border: "#5F5A52", icon: "#5F5A52" },
  SCHOOL_ADMIN: { bg: "#E8EFF6", border: "#08467D", icon: "#08467D" },
  SCHOOL_MANAGER: { bg: "#E8F2F1", border: "#195E56", icon: "#195E56" },
  SUPERVISOR: { bg: "#F3EDF8", border: "#7B4EA0", icon: "#7B4EA0" },
  SCHOOL_ACCOUNTANT: { bg: "#EAF5F0", border: "#2E7D62", icon: "#2E7D62" },
  SCHOOL_HEALTH_OFFICER: { bg: "#FCEBEA", border: "#B3261E", icon: "#B3261E" },
};

const ALL_ROLES: SchoolRole[] = [
  "TEACHER",
  "PARENT",
  "STUDENT",
  "SCHOOL_STAFF",
  "SCHOOL_HEALTH_OFFICER",
  "SCHOOL_ADMIN",
  "SCHOOL_MANAGER",
  "SUPERVISOR",
  "SCHOOL_ACCOUNTANT",
];

const ADMIN_ROLES: SchoolRole[] = [
  "SCHOOL_ADMIN",
  "SCHOOL_MANAGER",
  "SUPERVISOR",
  "SCHOOL_ACCOUNTANT",
];

// ── Form hero config ─────────────────────────────────────────────────────────

type DetailFormType =
  | "edit-roles"
  | "assign-teacher"
  | "assign-child"
  | "assign-parent"
  | "create-access";

function buildFormHeroConfig(t: ReturnType<typeof useTranslation>["t"]): Record<
  DetailFormType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    palette: "teal" | "warm" | "primary";
  }
> {
  return {
    "edit-roles": {
      icon: "shield-checkmark-outline",
      title: t("users.detail.forms.editRoles.title"),
      subtitle: t("users.detail.forms.editRoles.subtitle"),
      palette: "warm",
    },
    "assign-teacher": {
      icon: "link-outline",
      title: t("users.detail.forms.assignTeacher.title"),
      subtitle: t("users.detail.forms.assignTeacher.subtitle"),
      palette: "warm",
    },
    "assign-child": {
      icon: "link-outline",
      title: t("users.detail.forms.assignChild.title"),
      subtitle: t("users.detail.forms.assignChild.subtitle"),
      palette: "warm",
    },
    "assign-parent": {
      icon: "link-outline",
      title: t("users.detail.forms.assignParent.title"),
      subtitle: t("users.detail.forms.assignParent.subtitle"),
      palette: "warm",
    },
    "create-access": {
      icon: "person-add-outline",
      title: t("users.detail.forms.createAccess.title"),
      subtitle: t("users.detail.forms.createAccess.subtitle"),
      palette: "teal",
    },
  };
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const editRolesSchema = z.object({
  roles: z.array(z.string()).min(1, "Au moins un rôle est requis."),
});

type EditRolesValues = z.infer<typeof editRolesSchema>;

// ── InfoRow ───────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  testID?: string;
}

function InfoRow({ icon, label, value, testID }: InfoRowProps) {
  return (
    <View style={styles.infoRow} testID={testID}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ── ActionButton ──────────────────────────────────────────────────────────────

function ActionButton(props: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        {
          borderColor: props.color + "40",
          backgroundColor: props.color + "12",
        },
        props.disabled && styles.actionBtnDisabled,
      ]}
      onPress={props.onPress}
      disabled={props.disabled}
      activeOpacity={0.7}
      testID={props.testID}
    >
      <Ionicons
        name={props.icon}
        size={16}
        color={props.disabled ? colors.textSecondary : props.color}
      />
      <Text
        style={[
          styles.actionBtnLabel,
          { color: props.disabled ? colors.textSecondary : props.color },
        ]}
        numberOfLines={1}
      >
        {props.label}
      </Text>
    </TouchableOpacity>
  );
}

// ── CommonActionsFooter ───────────────────────────────────────────────────────

function CommonActionsFooter({
  member,
  onMessagePress,
  onEditRolesPress,
}: {
  member: SchoolMember;
  onMessagePress: () => void;
  onEditRolesPress: () => void;
}) {
  // Masquer le footer pour les student-only (pas de compte)
  if (!member.hasAccount) return null;
  return (
    <View style={styles.actionsFooter} testID="user-detail-common-actions">
      <ActionButton
        icon="chatbubble-outline"
        label="Message"
        color={colors.primary}
        onPress={onMessagePress}
        testID="action-send-message"
      />
      <ActionButton
        icon="shield-checkmark-outline"
        label="Modifier les rôles"
        color={colors.primary}
        onPress={onEditRolesPress}
        testID="action-edit-roles"
      />
    </View>
  );
}

// ── Teacher section ───────────────────────────────────────────────────────────

function TeacherSection({
  classes,
  onAgendaPress,
  onAssignmentPress,
}: {
  classes: SchoolUserTeachingClass[];
  user: SchoolUser;
  onAgendaPress: () => void;
  onAssignmentPress: () => void;
}) {
  const theme = ROLE_SECTION_COLORS.TEACHER!;
  return (
    <View
      style={[
        styles.roleSection,
        { backgroundColor: theme.bg, borderColor: theme.border },
      ]}
      testID="role-section-teacher"
    >
      <View style={styles.roleSectionHeader}>
        <Ionicons name="school-outline" size={15} color={theme.icon} />
        <Text style={[styles.roleSectionTitle, { color: theme.border }]}>
          Enseignant
        </Text>
      </View>
      {classes.length === 0 ? (
        <Text style={styles.roleSectionEmpty}>Aucune classe assignée</Text>
      ) : (
        classes.map((cls) => (
          <View
            key={cls.classId}
            style={styles.teachingClassRow}
            testID={`teacher-class-${cls.classId}`}
          >
            <View
              style={[styles.teachingClassBadge, { borderColor: theme.border }]}
            >
              <Ionicons name="people-outline" size={11} color={theme.icon} />
              <Text style={[styles.teachingClassName, { color: theme.border }]}>
                {cls.className}
              </Text>
            </View>
            <View style={styles.teachingSubjects}>
              {cls.subjects.map((s) => (
                <View
                  key={s.id}
                  style={[
                    styles.subjectPill,
                    { backgroundColor: theme.border },
                  ]}
                >
                  <Text style={styles.subjectPillText}>{s.name}</Text>
                </View>
              ))}
            </View>
          </View>
        ))
      )}
      <View
        style={[styles.sectionDivider, { borderTopColor: theme.border + "30" }]}
      />
      <View style={styles.actionsFooter} testID="teacher-actions">
        <ActionButton
          icon="calendar-outline"
          label="Agenda"
          color={theme.icon}
          onPress={onAgendaPress}
          testID="action-teacher-agenda"
        />
        <ActionButton
          icon="layers-outline"
          label="Affectations"
          color={theme.icon}
          onPress={onAssignmentPress}
          testID="action-teacher-assignments"
        />
      </View>
    </View>
  );
}

// ── Parent section ────────────────────────────────────────────────────────────

type ChildActionType = "discipline" | "notes" | "agenda";

function ParentSection({
  children,
  onAssignChildPress,
  onChildAction,
}: {
  children: {
    id: string;
    firstName: string;
    lastName: string;
    className?: string | null;
  }[];
  onAssignChildPress: () => void;
  onChildAction: (
    child: {
      id: string;
      firstName: string;
      lastName: string;
      className?: string | null;
    },
    action: ChildActionType,
  ) => void;
}) {
  const theme = ROLE_SECTION_COLORS.PARENT!;
  return (
    <View
      style={[
        styles.roleSection,
        { backgroundColor: theme.bg, borderColor: theme.border },
      ]}
      testID="role-section-parent"
    >
      <View style={styles.roleSectionHeader}>
        <Ionicons name="heart-outline" size={15} color={theme.icon} />
        <Text style={[styles.roleSectionTitle, { color: theme.border }]}>
          Parent
        </Text>
      </View>
      {children.length === 0 ? (
        <Text style={styles.roleSectionEmpty}>Aucun enfant enregistré</Text>
      ) : (
        children.map((child) => (
          <View key={child.id} testID={`parent-child-${child.id}`}>
            <View style={styles.personRow}>
              <Ionicons name="person-outline" size={13} color={theme.icon} />
              <Text style={[styles.personName, styles.personNameFlex]}>
                {child.lastName} {child.firstName}
              </Text>
              {child.className ? (
                <View
                  style={[styles.classBadge, { borderColor: theme.border }]}
                >
                  <Text
                    style={[styles.classBadgeText, { color: theme.border }]}
                  >
                    {child.className}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.childActionsRow}>
              <ActionButton
                icon="warning-outline"
                label="Discipline"
                color={theme.icon}
                onPress={() => onChildAction(child, "discipline")}
                testID={`action-child-discipline-${child.id}`}
              />
              <ActionButton
                icon="bar-chart-outline"
                label="Notes"
                color={theme.icon}
                onPress={() => onChildAction(child, "notes")}
                testID={`action-child-notes-${child.id}`}
              />
              <ActionButton
                icon="calendar-outline"
                label="Agenda"
                color={theme.icon}
                onPress={() => onChildAction(child, "agenda")}
                testID={`action-child-agenda-${child.id}`}
              />
            </View>
          </View>
        ))
      )}
      <View
        style={[styles.sectionDivider, { borderTopColor: theme.border + "30" }]}
      />
      <View style={styles.actionsFooter} testID="parent-actions">
        <ActionButton
          icon="person-add-outline"
          label="Affecter un enfant"
          color={theme.icon}
          onPress={onAssignChildPress}
          testID="action-assign-child"
        />
        <ActionButton
          icon="card-outline"
          label="Paiements"
          color={colors.textSecondary}
          onPress={() => {}}
          disabled
          testID="action-payments-disabled"
        />
      </View>
    </View>
  );
}

// ── Student section ───────────────────────────────────────────────────────────

function StudentSection({
  enrollments,
  parents,
  hasAccount,
  isStudent,
  onDisciplinePress,
  onNotesPress,
  onAgendaPress,
  onDevoirsPress,
  onCreateAccessPress,
  onResetPasswordPress,
  onAssignParentPress,
}: {
  enrollments: {
    id: string;
    classId: string;
    className: string;
    schoolYear: string;
  }[];
  parents?: SchoolUserParent[];
  studentId: string;
  hasAccount: boolean;
  isStudent: boolean;
  onDisciplinePress: () => void;
  onNotesPress: () => void;
  onAgendaPress: () => void;
  onDevoirsPress: () => void;
  onCreateAccessPress: () => void;
  onResetPasswordPress: () => void;
  onAssignParentPress: () => void;
}) {
  const theme = ROLE_SECTION_COLORS.STUDENT!;
  const safeParents = parents ?? [];
  return (
    <View
      style={[
        styles.roleSection,
        { backgroundColor: theme.bg, borderColor: theme.border },
      ]}
      testID="role-section-student"
    >
      <View style={styles.roleSectionHeader}>
        <Ionicons name="book-outline" size={15} color={theme.icon} />
        <Text style={[styles.roleSectionTitle, { color: theme.border }]}>
          Élève
        </Text>
      </View>
      {enrollments.length > 0 ? (
        <View style={styles.studentClassRow}>
          <Ionicons name="home-outline" size={13} color={theme.icon} />
          <Text style={styles.personName}>{enrollments[0].className}</Text>
          <Text style={[styles.personSub, { color: theme.border }]}>
            {enrollments[0].schoolYear}
          </Text>
        </View>
      ) : (
        <Text style={styles.roleSectionEmpty}>Aucune inscription active</Text>
      )}
      {safeParents.length > 0 ? (
        <View style={styles.studentParentsBlock} testID="student-parents">
          <Text style={[styles.studentParentsLabel, { color: theme.border }]}>
            Parents / tuteurs
          </Text>
          {safeParents.map((p) => (
            <View
              key={p.id}
              style={styles.personRow}
              testID={`student-parent-${p.id}`}
            >
              <Ionicons name="people-outline" size={13} color={theme.icon} />
              <Text style={[styles.personName, styles.personNameFlex]}>
                {p.lastName} {p.firstName}
              </Text>
              {p.phone ? (
                <Text style={[styles.personSub, { color: theme.border }]}>
                  {p.phone}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
      <View
        style={[styles.sectionDivider, { borderTopColor: theme.border + "30" }]}
      />
      <View style={styles.actionsFooter} testID="student-actions">
        <ActionButton
          icon="warning-outline"
          label="Discipline"
          color={theme.icon}
          onPress={onDisciplinePress}
          testID="action-student-discipline"
        />
        <ActionButton
          icon="bar-chart-outline"
          label="Notes"
          color={theme.icon}
          onPress={onNotesPress}
          testID="action-student-notes"
        />
        <ActionButton
          icon="calendar-outline"
          label="Agenda"
          color={theme.icon}
          onPress={onAgendaPress}
          testID="action-student-agenda"
        />
        <ActionButton
          icon="document-text-outline"
          label="Devoirs"
          color={theme.icon}
          onPress={onDevoirsPress}
          disabled={!enrollments[0]?.classId}
          testID="action-student-devoirs"
        />
        {!hasAccount ? (
          <ActionButton
            icon="person-add-outline"
            label="Créer un accès"
            color="#195E56"
            onPress={onCreateAccessPress}
            testID="action-create-access"
          />
        ) : null}
        {hasAccount && isStudent ? (
          <ActionButton
            icon="key-outline"
            label="Réinitialiser MDP"
            color="#7B4EA0"
            onPress={onResetPasswordPress}
            testID="action-reset-password"
          />
        ) : null}
        <ActionButton
          icon="people-circle-outline"
          label="Associer un parent"
          color="#D89B5B"
          onPress={onAssignParentPress}
          testID="action-assign-parent"
        />
      </View>
    </View>
  );
}

// ── Staff section ─────────────────────────────────────────────────────────────

function StaffSection({ functions }: { functions: SchoolUserStaffFunction[] }) {
  const theme = ROLE_SECTION_COLORS.SCHOOL_STAFF!;
  return (
    <View
      style={[
        styles.roleSection,
        { backgroundColor: theme.bg, borderColor: theme.border },
      ]}
      testID="role-section-staff"
    >
      <View style={styles.roleSectionHeader}>
        <Ionicons name="briefcase-outline" size={15} color={theme.icon} />
        <Text style={[styles.roleSectionTitle, { color: theme.border }]}>
          Personnel
        </Text>
      </View>
      {functions.length > 0 ? (
        <View style={styles.staffFunctions}>
          {functions.map((fn) => (
            <View
              key={fn.id}
              style={[
                styles.staffFunctionPill,
                { backgroundColor: theme.border },
              ]}
              testID={`staff-function-${fn.id}`}
            >
              <Text style={styles.staffFunctionText}>{fn.name}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.roleSectionEmpty}>Aucune fonction assignée</Text>
      )}
    </View>
  );
}

// ── Admin/Manager/Supervisor section ─────────────────────────────────────────

function AdminRoleSection({ role }: { role: SchoolRole }) {
  const theme = ROLE_SECTION_COLORS[role] ?? {
    bg: colors.warmSurface,
    border: colors.primary,
    icon: colors.primary,
  };
  const label = ROLE_LABELS[role] ?? role;
  const iconMap: Partial<Record<SchoolRole, keyof typeof Ionicons.glyphMap>> = {
    SCHOOL_ADMIN: "shield-outline",
    SCHOOL_MANAGER: "business-outline",
    SUPERVISOR: "eye-outline",
    SCHOOL_ACCOUNTANT: "calculator-outline",
  };
  const icon = iconMap[role] ?? "star-outline";
  return (
    <View
      style={[
        styles.roleSection,
        { backgroundColor: theme.bg, borderColor: theme.border },
      ]}
      testID={`role-section-${role.toLowerCase()}`}
    >
      <View style={styles.roleSectionHeader}>
        <Ionicons name={icon} size={15} color={theme.icon} />
        <Text style={[styles.roleSectionTitle, { color: theme.border }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.roleSectionEmpty, { color: theme.border }]}>
        Rôle administratif
      </Text>
    </View>
  );
}

// ── EditRolesFormContent ─────────────────────────────────────────────────────

function EditRolesFormContent({
  currentRoles,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  currentRoles: SchoolRole[];
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (roles: SchoolRole[]) => void;
}) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditRolesValues>({
    resolver: zodResolver(editRolesSchema),
    mode: "onChange",
    defaultValues: { roles: currentRoles },
  });

  const doSubmit = (values: EditRolesValues) => {
    onSubmit(values.roles as SchoolRole[]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="edit-roles-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="roles"
          render={({ field: { value, onChange } }) => (
            <View style={styles.roleCheckList}>
              {ALL_ROLES.map((role) => {
                const theme = ROLE_SECTION_COLORS[role] ?? {
                  bg: colors.warmSurface,
                  border: colors.primary,
                  icon: colors.primary,
                };
                const checked = value.includes(role);
                return (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleCheckRow,
                      checked && {
                        backgroundColor: theme.bg,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => {
                      onChange(
                        checked
                          ? value.filter((r) => r !== role)
                          : [...value, role],
                      );
                    }}
                    testID={`role-check-${role.toLowerCase()}`}
                  >
                    <View
                      style={[
                        styles.roleCheckBox,
                        checked && {
                          backgroundColor: theme.border,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      {checked ? (
                        <Ionicons
                          name="checkmark"
                          size={12}
                          color={colors.white}
                        />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.roleCheckLabel,
                        checked && { color: theme.border, fontWeight: "700" },
                      ]}
                    >
                      {ROLE_LABELS[role] ?? role}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {errors.roles ? (
                <Text style={styles.rolesError} testID="edit-roles-error">
                  {errors.roles.message}
                </Text>
              ) : null}
            </View>
          )}
        />
      </ScrollView>
      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={t("users.detail.forms.editRoles.submit")}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          onSubmit={handleSubmit(doSubmit)}
          testIDPrefix="edit-roles"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ── TeacherAssignmentFormContent ─────────────────────────────────────────────

function TeacherAssignmentFormContent({
  isSubmitting,
  teacherUserId,
  schoolYears,
  classrooms,
  subjects,
  onCancel,
  onSubmit,
}: {
  isSubmitting: boolean;
  teacherUserId: string;
  schoolYears: TeacherSchoolYearOption[];
  classrooms: TeacherClassroomOption[];
  subjects: TeacherSubjectOption[];
  onCancel: () => void;
  onSubmit: (values: TeacherAssignmentFormValues) => void;
}) {
  const { t } = useTranslation();
  const activeSchoolYear =
    schoolYears.find((y) => y.isActive) ?? schoolYears[0];

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TeacherAssignmentFormValues>({
    resolver: zodResolver(teacherAssignmentFormSchema),
    mode: "onChange",
    defaultValues: {
      schoolYearId: activeSchoolYear?.id ?? "",
      teacherUserId,
      classId: "",
      subjectId: subjects[0]?.id ?? "",
    },
  });

  const schoolYearId = watch("schoolYearId");

  const { scrollViewRef, registerFieldOffset, focusFirstInvalidField } =
    useScrollToFirstError<keyof TeacherAssignmentFormValues>();
  const FIELD_ORDER: Array<keyof TeacherAssignmentFormValues> = [
    "schoolYearId",
    "classId",
    "subjectId",
  ];

  const schoolYearOptions = schoolYears.map((y) => ({
    value: y.id,
    label: y.isActive ? `${y.label} ✓` : y.label,
  }));
  const classOptions = classrooms
    .filter((c) => !schoolYearId || c.schoolYear.id === schoolYearId)
    .map((c) => ({ value: c.id, label: c.name }));
  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="teacher-assignment-form-content"
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="schoolYearId"
          render={({ field: { value, onChange } }) => (
            <View
              style={styles.formField}
              onLayout={registerFieldOffset("schoolYearId")}
            >
              <Text style={styles.formLabel}>
                {t("users.detail.forms.assignTeacher.schoolYear.label")}
              </Text>
              <InlineSelectDropDown
                options={schoolYearOptions}
                value={value}
                onChange={onChange}
                placeholder={t(
                  "users.detail.forms.assignTeacher.schoolYear.placeholder",
                )}
                hasError={!!errors.schoolYearId}
                testID="teacher-assignment-school-year"
              />
              {errors.schoolYearId ? (
                <Text
                  style={styles.formError}
                  testID="teacher-assignment-school-year-error"
                >
                  {errors.schoolYearId.message}
                </Text>
              ) : null}
            </View>
          )}
        />
        <Controller
          control={control}
          name="classId"
          render={({ field: { value, onChange } }) => (
            <View
              style={styles.formField}
              onLayout={registerFieldOffset("classId")}
            >
              <Text style={styles.formLabel}>
                {t("users.detail.forms.assignTeacher.class.label")}
              </Text>
              <InlineSelectDropDown
                options={classOptions}
                value={value}
                onChange={onChange}
                placeholder={t(
                  "users.detail.forms.assignTeacher.class.placeholder",
                )}
                hasError={!!errors.classId}
                testID="teacher-assignment-class"
              />
              {errors.classId ? (
                <Text
                  style={styles.formError}
                  testID="teacher-assignment-class-error"
                >
                  {errors.classId.message}
                </Text>
              ) : null}
            </View>
          )}
        />
        <Controller
          control={control}
          name="subjectId"
          render={({ field: { value, onChange } }) => (
            <View
              style={styles.formField}
              onLayout={registerFieldOffset("subjectId")}
            >
              <Text style={styles.formLabel}>
                {t("users.detail.forms.assignTeacher.subject.label")}
              </Text>
              <InlineSelectDropDown
                options={subjectOptions}
                value={value}
                onChange={onChange}
                placeholder={t(
                  "users.detail.forms.assignTeacher.subject.placeholder",
                )}
                hasError={!!errors.subjectId}
                testID="teacher-assignment-subject"
              />
              {errors.subjectId ? (
                <Text
                  style={styles.formError}
                  testID="teacher-assignment-subject-error"
                >
                  {errors.subjectId.message}
                </Text>
              ) : null}
            </View>
          )}
        />
      </ScrollView>
      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={t("users.detail.forms.assignTeacher.submit")}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          onSubmit={handleSubmit(onSubmit, (errs) =>
            focusFirstInvalidField(FIELD_ORDER, errs),
          )}
          testIDPrefix="teacher-assignment"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ── AssignChildFormContent ───────────────────────────────────────────────────

function AssignChildFormContent({
  schoolSlug,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  schoolSlug: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (studentId: string) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminStudentRow | null>(null);

  const loadStudents = useCallback(
    async (search: string) => {
      if (!schoolSlug) return;
      setIsLoading(true);
      try {
        const res = await familyApi.listAdminStudents(schoolSlug, { search });
        setStudents(res.students ?? []);
        setLoadError(null);
      } catch (err) {
        setStudents([]);
        setLoadError(extractApiError(err));
      } finally {
        setIsLoading(false);
      }
    },
    [schoolSlug],
  );

  useEffect(() => {
    void loadStudents("");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadStudents(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, loadStudents]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="assign-child-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("users.detail.forms.assignChild.searchPlaceholder")}
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          testID="assign-child-search"
        />
        {isLoading ? (
          <ActivityIndicator
            color={colors.primary}
            size="small"
            style={{ marginTop: 12 }}
          />
        ) : loadError ? (
          <Text style={styles.formError} testID="assign-child-load-error">
            {loadError}
          </Text>
        ) : (
          <View style={styles.studentList}>
            {students.map((student) => {
              const isSelected = selected?.id === student.id;
              return (
                <TouchableOpacity
                  key={student.id}
                  style={[
                    styles.studentRow,
                    isSelected && styles.studentRowSelected,
                  ]}
                  onPress={() => setSelected(isSelected ? null : student)}
                  testID={`assign-child-student-${student.id}`}
                >
                  <View style={styles.studentRowText}>
                    <Text
                      style={[
                        styles.studentName,
                        isSelected && styles.studentNameSelected,
                      ]}
                    >
                      {student.lastName} {student.firstName}
                    </Text>
                    {student.currentEnrollment ? (
                      <Text style={styles.studentClass}>
                        {student.currentEnrollment.class.name} ·{" "}
                        {student.currentEnrollment.schoolYear.label}
                      </Text>
                    ) : null}
                  </View>
                  {isSelected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
            {!isLoading && students.length === 0 ? (
              <Text style={styles.noStudents}>
                {t("users.detail.forms.assignChild.empty")}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>
      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={t("users.detail.forms.assignChild.submit")}
          isSubmitting={isSubmitting}
          submitDisabled={!selected}
          onCancel={onCancel}
          onSubmit={() => {
            if (selected) onSubmit(selected.id);
          }}
          testIDPrefix="assign-child"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ── AssignParentFormContent ──────────────────────────────────────────────────

function NewParentInlineForm({
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: ContactOnlyCreateFormValues) => void;
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
    <View style={styles.newParentForm} testID="assign-parent-new-form">
      <ContactModeFields
        control={control}
        errors={errors}
        mode={mode}
        testIDPrefix="assign-parent-new"
      />
      <FormActions
        submitLabel={t("users.assignParent.new.submit")}
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        onSubmit={handleSubmit(onSubmit, (errs) => {
          const first = Object.keys(errs)[0];
          if (first) setFocus(first as Parameters<typeof setFocus>[0]);
        })}
        testIDPrefix="assign-parent-new"
      />
    </View>
  );
}

function AssignParentFormContent({
  schoolSlug,
  isSubmitting,
  onCancel,
  onSubmitExisting,
  onSubmitNew,
}: {
  schoolSlug: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmitExisting: (parentUserId: string) => void;
  onSubmitNew: (values: ContactOnlyCreateFormValues) => void;
}) {
  const { t } = useTranslation();
  const [subMode, setSubMode] = useState<"existing" | "new">("existing");
  const [query, setQuery] = useState("");
  const [parents, setParents] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserItem | null>(null);

  const loadParents = useCallback(
    async (search: string) => {
      if (!schoolSlug) return;
      setIsLoading(true);
      try {
        const res = await usersApi.list(schoolSlug, {
          search,
          role: "PARENT",
          page: 1,
        });
        setParents(res.data.filter((u): u is UserItem => u.hasAccount));
        setLoadError(null);
      } catch (err) {
        setParents([]);
        setLoadError(extractApiError(err));
      } finally {
        setIsLoading(false);
      }
    },
    [schoolSlug],
  );

  useEffect(() => {
    void loadParents("");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadParents(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, loadParents]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="assign-parent-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modeRow} testID="assign-parent-submode">
          <TouchableOpacity
            style={[
              styles.modeChip,
              subMode === "existing" && styles.modeChipActive,
            ]}
            onPress={() => setSubMode("existing")}
            testID="assign-parent-submode-existing"
          >
            <Text
              style={[
                styles.modeChipLabel,
                subMode === "existing" && styles.modeChipLabelActive,
              ]}
            >
              {t("users.assignParent.mode.existing")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeChip,
              subMode === "new" && styles.modeChipActive,
            ]}
            onPress={() => setSubMode("new")}
            testID="assign-parent-submode-new"
          >
            <Text
              style={[
                styles.modeChipLabel,
                subMode === "new" && styles.modeChipLabelActive,
              ]}
            >
              {t("users.assignParent.mode.new")}
            </Text>
          </TouchableOpacity>
        </View>

        {subMode === "new" ? (
          <NewParentInlineForm
            isSubmitting={isSubmitting}
            onCancel={onCancel}
            onSubmit={onSubmitNew}
          />
        ) : (
          <>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t(
                "users.detail.forms.assignParent.searchPlaceholder",
              )}
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
              testID="assign-parent-search"
            />
            {isLoading ? (
              <ActivityIndicator
                color={colors.primary}
                size="small"
                style={{ marginTop: 12 }}
              />
            ) : loadError ? (
              <Text style={styles.formError} testID="assign-parent-load-error">
                {loadError}
              </Text>
            ) : (
              <View style={styles.studentList}>
                {parents.map((parent) => {
                  const isSelected = selected?.id === parent.id;
                  return (
                    <TouchableOpacity
                      key={parent.id}
                      style={[
                        styles.studentRow,
                        isSelected && styles.studentRowSelected,
                      ]}
                      onPress={() => setSelected(isSelected ? null : parent)}
                      testID={`assign-parent-user-${parent.id}`}
                    >
                      <View style={styles.studentRowText}>
                        <Text
                          style={[
                            styles.studentName,
                            isSelected && styles.studentNameSelected,
                          ]}
                        >
                          {parent.lastName} {parent.firstName}
                        </Text>
                        {parent.phone ? (
                          <Text style={styles.studentClass}>
                            {parent.phone}
                          </Text>
                        ) : null}
                      </View>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.primary}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
                {!isLoading && parents.length === 0 ? (
                  <Text style={styles.noStudents}>
                    {t("users.detail.forms.assignParent.empty")}
                  </Text>
                ) : null}
              </View>
            )}
          </>
        )}
      </ScrollView>
      {subMode === "existing" ? (
        <View style={styles.formActionsBar}>
          <FormActions
            submitLabel={t("users.detail.forms.assignParent.submit")}
            isSubmitting={isSubmitting}
            submitDisabled={!selected}
            onCancel={onCancel}
            onSubmit={() => {
              if (selected) onSubmitExisting(selected.id);
            }}
            testIDPrefix="assign-parent"
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

// ── UserDetailModal ───────────────────────────────────────────────────────────

interface UserDetailModalProps {
  user: SchoolMember | null;
  schoolSlug: string;
  onClose: () => void;
  testID?: string;
}

export function UserDetailModal({
  user,
  schoolSlug,
  onClose,
  testID,
}: UserDetailModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const showSuccess = useSuccessToastStore((s) => s.showSuccess);
  const showError = useSuccessToastStore((s) => s.showError);

  const [detail, setDetail] = useState<
    SchoolUserDetail | StudentOnlyDetail | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Forms (inline, no Modal — see skill improve-mobile-form) ────────────────
  const { t: tDetail } = useTranslation();
  const [view, setView] = useState<"detail" | "forms">("detail");
  const [formType, setFormType] = useState<DetailFormType | null>(null);

  function exitForms() {
    setView("detail");
    setFormType(null);
  }

  const [isSubmittingRoles, setIsSubmittingRoles] = useState(false);

  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [schoolYears, setSchoolYears] = useState<TeacherSchoolYearOption[]>([]);
  const [classrooms, setClassrooms] = useState<TeacherClassroomOption[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubjectOption[]>([]);

  const [isSubmittingChild, setIsSubmittingChild] = useState(false);

  const [isSubmittingParent, setIsSubmittingParent] = useState(false);

  type CredentialsDisplay = {
    username: string;
    temporaryPassword: string;
    title: string;
  };
  const [credentialsDisplay, setCredentialsDisplay] =
    useState<CredentialsDisplay | null>(null);

  const normalizeStudentOnlyDetail = useCallback(
    (data: StudentOnlyDetail): StudentOnlyDetail => ({
      ...data,
      enrollments: data.enrollments ?? [],
      studentParents: data.studentParents ?? [],
    }),
    [],
  );

  const loadDetail = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      if (user.type === "student-only") {
        const data = await usersApi.getStudentProfile(
          schoolSlug,
          user.studentId,
        );
        setDetail(normalizeStudentOnlyDetail(data));
      } else {
        const data = await usersApi.get(schoolSlug, user.id);
        setDetail(data);
      }
    } catch {
      setError("Impossible de charger les détails de cet utilisateur.");
    } finally {
      setIsLoading(false);
    }
  }, [user, schoolSlug, normalizeStudentOnlyDetail]);

  useEffect(() => {
    if (user) {
      setDetail(null);
      void loadDetail();
    }
  }, [user, loadDetail]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(() => {
    if (!user) return;
    const fullName = `${user.lastName} ${user.firstName}`.trim();
    onClose();
    router.push({
      pathname: "/(home)/messages/compose",
      params: {
        prefilledRecipientId: user.id,
        prefilledRecipientLabel: fullName,
        prefilledRecipientEmail: user.email ?? "",
      },
    } as never);
  }, [user, onClose, router]);

  const handleOpenEditRoles = useCallback(() => {
    setFormType("edit-roles");
    setView("forms");
  }, []);

  const handleSubmitRoles = useCallback(
    async (roles: SchoolRole[]) => {
      if (!user) return;
      setIsSubmittingRoles(true);
      try {
        await usersApi.updateRoles(schoolSlug, user.id, roles);
        exitForms();
        await loadDetail();
        showSuccess({
          title: "Rôles mis à jour",
          message: "Les rôles de l'utilisateur ont été modifiés avec succès.",
        });
      } catch (err) {
        showError({ title: "Erreur", message: extractApiError(err) });
      } finally {
        setIsSubmittingRoles(false);
      }
    },
    [user, schoolSlug, loadDetail, showSuccess, showError],
  );

  const handleOpenAssignment = useCallback(async () => {
    setFormType("assign-teacher");
    setView("forms");
    try {
      const [years, rooms, subs] = await Promise.all([
        teachersApi.listSchoolYears(schoolSlug),
        teachersApi.listClassrooms(schoolSlug),
        teachersApi.listSubjects(schoolSlug),
      ]);
      setSchoolYears(years);
      setClassrooms(rooms);
      setSubjects(subs);
    } catch {
      // le formulaire d'affectation gère ses erreurs via des options vides
    }
  }, [schoolSlug]);

  const handleSubmitAssignment = useCallback(
    async (values: {
      schoolYearId: string;
      teacherUserId: string;
      classId: string;
      subjectId: string;
    }) => {
      setIsSubmittingAssignment(true);
      try {
        const payload: TeacherAssignmentPayload = {
          schoolYearId: values.schoolYearId,
          teacherUserId: values.teacherUserId,
          classId: values.classId,
          subjectId: values.subjectId,
        };
        await teachersApi.createAssignment(schoolSlug, payload);
        exitForms();
        await loadDetail();
        showSuccess({
          title: "Affectation créée",
          message: "L'enseignant a été affecté à la classe et matière.",
        });
      } catch (err) {
        showError({ title: "Erreur", message: extractApiError(err) });
      } finally {
        setIsSubmittingAssignment(false);
      }
    },
    [schoolSlug, loadDetail, showSuccess, showError],
  );

  const handleOpenAssignChild = useCallback(() => {
    setFormType("assign-child");
    setView("forms");
  }, []);

  const handleSubmitAssignChild = useCallback(
    async (studentId: string) => {
      if (!user) return;
      setIsSubmittingChild(true);
      try {
        await familyApi.linkExistingParent(schoolSlug, {
          studentId,
          parentUserId: user.id,
        });
        exitForms();
        await loadDetail();
        showSuccess({
          title: "Enfant affecté",
          message: "Le lien parent-enfant a été créé avec succès.",
        });
      } catch (err) {
        showError({ title: "Erreur", message: extractApiError(err) });
      } finally {
        setIsSubmittingChild(false);
      }
    },
    [user, schoolSlug, loadDetail, showSuccess, showError],
  );

  const handleOpenAssignParent = useCallback(() => {
    setFormType("assign-parent");
    setView("forms");
  }, []);

  const handleSubmitAssignParent = useCallback(
    async (parentUserId: string) => {
      if (!user) return;
      const studentId = resolveStudentId(user);
      setIsSubmittingParent(true);
      try {
        await familyApi.linkExistingParent(schoolSlug, {
          studentId,
          parentUserId,
        });
        exitForms();
        await loadDetail();
        showSuccess({
          title: "Parent associé",
          message: "Le lien parent-élève a été créé avec succès.",
        });
      } catch (err) {
        showError({ title: "Erreur", message: extractApiError(err) });
      } finally {
        setIsSubmittingParent(false);
      }
    },
    [user, schoolSlug, loadDetail, showSuccess, showError],
  );

  const handleCreateNewParent = useCallback(
    async (values: ContactOnlyCreateFormValues) => {
      if (!user) return;
      const studentId = resolveStudentId(user);
      setIsSubmittingParent(true);
      try {
        await familyApi.createParent(schoolSlug, {
          studentId,
          ...(values.mode === "phone"
            ? { phone: values.phone, pin: values.pin }
            : { email: values.email, password: values.password }),
        });
        exitForms();
        await loadDetail();
        showSuccess({
          title: "Parent associé",
          message: "Le lien parent-élève a été créé avec succès.",
        });
      } catch (err) {
        showError({ title: "Erreur", message: extractApiError(err) });
      } finally {
        setIsSubmittingParent(false);
      }
    },
    [user, schoolSlug, loadDetail, showSuccess, showError],
  );

  const handleTeacherAgenda = useCallback(() => {
    if (!user) return;
    const fullName = `${user.lastName} ${user.firstName}`.trim();
    onClose();
    router.push({
      pathname: "/(home)/agenda",
      params: { teacherId: user.id, teacherName: fullName },
    } as never);
  }, [user, onClose, router]);

  const handleStudentDiscipline = useCallback(() => {
    if (!user) return;
    onClose();
    router.push({
      pathname: "/(home)/discipline-student/[studentId]",
      params: { studentId: resolveStudentId(user) },
    } as never);
  }, [user, onClose, router]);

  const handleStudentNotes = useCallback(() => {
    if (!user) return;
    onClose();
    router.push({
      pathname: "/(home)/notes/child/[childId]",
      params: { childId: resolveStudentId(user) },
    } as never);
  }, [user, onClose, router]);

  const handleStudentAgenda = useCallback(() => {
    if (!user) return;
    onClose();
    router.push({
      pathname: "/(home)/timetable/child/[childId]",
      params: { childId: resolveStudentId(user) },
    } as never);
  }, [user, onClose, router]);

  const handleStudentDevoirs = useCallback(() => {
    if (!user || !detail?.enrollments[0]?.classId) return;
    onClose();
    router.push({
      pathname: "/(home)/classes/[classId]/homework",
      params: { classId: detail.enrollments[0].classId },
    } as never);
  }, [user, detail, onClose, router]);

  const handleCreateAccess = useCallback(() => {
    setFormType("create-access");
    setView("forms");
  }, []);

  const handlePromoteSuccess = useCallback(
    async (credentials: PromoteStudentResponse) => {
      exitForms();
      await loadDetail();
      setCredentialsDisplay({
        username: credentials.username,
        temporaryPassword: credentials.temporaryPassword,
        title: "Accès créé",
      });
      showSuccess({
        title: "Accès créé",
        message: "L'élève peut maintenant se connecter avec son identifiant.",
      });
    },
    [loadDetail, showSuccess],
  );

  const handleResetPassword = useCallback(async () => {
    if (!user) return;
    const studentId = resolveStudentId(user);
    try {
      const result = await usersApi.resetStudentPassword(schoolSlug, studentId);
      setCredentialsDisplay({
        username: user.hasAccount && "id" in user ? user.id : "",
        temporaryPassword: result.temporaryPassword,
        title: "Mot de passe réinitialisé",
      });
    } catch (err) {
      showError({ title: "Erreur", message: extractApiError(err) });
    }
  }, [user, schoolSlug, showError]);

  const handleChildAction = useCallback(
    (
      child: {
        id: string;
        firstName: string;
        lastName: string;
        className?: string | null;
      },
      action: "discipline" | "notes" | "agenda",
    ) => {
      onClose();
      if (action === "discipline") {
        router.push({
          pathname: "/(home)/discipline-student/[studentId]",
          params: { studentId: child.id },
        } as never);
      } else if (action === "notes") {
        router.push({
          pathname: "/(home)/notes/child/[childId]",
          params: { childId: child.id },
        } as never);
      } else {
        router.push({
          pathname: "/(home)/timetable/child/[childId]",
          params: { childId: child.id },
        } as never);
      }
    },
    [onClose, router],
  );

  if (!user) return null;

  const fullName = `${user.lastName} ${user.firstName}`.trim();
  const statusCfg = user.hasAccount
    ? STATUS_CONFIG[user.activationStatus]
    : null;
  const studentIdForActions = resolveStudentId(user);
  const formHeroConfig = buildFormHeroConfig(tDetail);

  function renderRoleSections() {
    if (!detail) return null;

    // Student-only : afficher directement la section élève
    if (user!.type === "student-only") {
      const studentDetail =
        detail as import("../../types/users.types").StudentOnlyDetail;
      return (
        <StudentSection
          key="student-only"
          enrollments={studentDetail.enrollments ?? []}
          parents={studentDetail.studentParents ?? []}
          studentId={user!.studentId}
          hasAccount={false}
          isStudent={true}
          onDisciplinePress={handleStudentDiscipline}
          onNotesPress={handleStudentNotes}
          onAgendaPress={handleStudentAgenda}
          onDevoirsPress={handleStudentDevoirs}
          onCreateAccessPress={handleCreateAccess}
          onResetPasswordPress={() => void handleResetPassword()}
          onAssignParentPress={handleOpenAssignParent}
        />
      );
    }

    const userDetail = detail as SchoolUserDetail;
    const roles = user!.roles as SchoolRole[];
    return roles.map((role) => {
      if (role === "TEACHER") {
        return (
          <TeacherSection
            key={role}
            classes={userDetail.teachingClasses ?? []}
            user={user!}
            onAgendaPress={handleTeacherAgenda}
            onAssignmentPress={() => void handleOpenAssignment()}
          />
        );
      }
      if (role === "PARENT") {
        return (
          <ParentSection
            key={role}
            children={userDetail.children ?? []}
            onAssignChildPress={handleOpenAssignChild}
            onChildAction={handleChildAction}
          />
        );
      }
      if (role === "STUDENT") {
        return (
          <StudentSection
            key={role}
            enrollments={userDetail.enrollments ?? []}
            parents={userDetail.studentParents ?? []}
            studentId={resolveStudentId(user!)}
            hasAccount={true}
            isStudent={true}
            onDisciplinePress={handleStudentDiscipline}
            onNotesPress={handleStudentNotes}
            onAgendaPress={handleStudentAgenda}
            onDevoirsPress={handleStudentDevoirs}
            onCreateAccessPress={handleCreateAccess}
            onResetPasswordPress={() => void handleResetPassword()}
            onAssignParentPress={handleOpenAssignParent}
          />
        );
      }
      if (role === "SCHOOL_STAFF" || role === "SCHOOL_HEALTH_OFFICER") {
        return (
          <StaffSection
            key={role}
            functions={userDetail.staffFunctions ?? []}
          />
        );
      }
      if (ADMIN_ROLES.includes(role)) {
        return <AdminRoleSection key={role} role={role} />;
      }
      return null;
    });
  }

  return (
    <>
      <View style={styles.modalRoot} testID={testID ?? "user-detail-modal"}>
        <View style={styles.headerWrap}>
          <ModuleHeader
            title="Utilisateurs"
            subtitle={fullName}
            onBack={() => (view === "forms" ? exitForms() : onClose())}
            topInset={insets.top}
            testID="user-detail-header"
            backTestID="user-detail-close"
            titleTestID="user-detail-title"
            subtitleTestID="user-detail-name"
          />
        </View>

        {view === "forms" && formType ? (
          <View style={styles.formsTabContent} testID="user-detail-forms-tab">
            <View style={styles.heroWrapper}>
              <FormHero
                icon={formHeroConfig[formType].icon}
                title={formHeroConfig[formType].title}
                subtitle={formHeroConfig[formType].subtitle}
                palette={formHeroConfig[formType].palette}
                testID="user-detail-form-hero"
              />
            </View>
            {formType === "edit-roles" ? (
              <EditRolesFormContent
                currentRoles={
                  (detail && "roles" in detail
                    ? (detail.roles as SchoolRole[])
                    : null) ??
                  user?.roles ??
                  []
                }
                isSubmitting={isSubmittingRoles}
                onCancel={exitForms}
                onSubmit={(roles) => void handleSubmitRoles(roles)}
              />
            ) : null}
            {formType === "assign-teacher" ? (
              <TeacherAssignmentFormContent
                isSubmitting={isSubmittingAssignment}
                teacherUserId={user.id}
                schoolYears={schoolYears}
                classrooms={classrooms}
                subjects={subjects}
                onCancel={exitForms}
                onSubmit={(values) => void handleSubmitAssignment(values)}
              />
            ) : null}
            {formType === "assign-child" ? (
              <AssignChildFormContent
                schoolSlug={schoolSlug}
                isSubmitting={isSubmittingChild}
                onCancel={exitForms}
                onSubmit={(studentId) =>
                  void handleSubmitAssignChild(studentId)
                }
              />
            ) : null}
            {formType === "assign-parent" ? (
              <AssignParentFormContent
                schoolSlug={schoolSlug}
                isSubmitting={isSubmittingParent}
                onCancel={exitForms}
                onSubmitExisting={(parentUserId) =>
                  void handleSubmitAssignParent(parentUserId)
                }
                onSubmitNew={(values) => void handleCreateNewParent(values)}
              />
            ) : null}
            {formType === "create-access" ? (
              <PromoteToUserFormContent
                schoolSlug={schoolSlug}
                studentId={studentIdForActions}
                studentName={fullName}
                onCancel={exitForms}
                onSuccess={(credentials) =>
                  void handlePromoteSuccess(credentials)
                }
              />
            ) : null}
          </View>
        ) : (
          <ScrollView
            style={styles.body}
            contentContainerStyle={[
              styles.bodyContent,
              { paddingBottom: insets.bottom + BOTTOM_TAB_BAR_HEIGHT + 24 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Carte profil */}
            <View style={styles.profileCard} testID="user-detail-profile">
              <View style={styles.profileMainRow} testID="user-detail-fullname">
                <Text style={styles.profileFullName}>{fullName}</Text>
                {statusCfg ? (
                  <View style={styles.profileStatusChip}>
                    <Ionicons
                      name={statusCfg.icon}
                      size={12}
                      color={statusCfg.color}
                    />
                    <Text
                      style={[
                        styles.profileStatusLabel,
                        { color: statusCfg.color },
                      ]}
                    >
                      {statusCfg.label}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.profileStatusChip}>
                    <Text
                      style={[
                        styles.profileStatusLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Sans compte
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.profileRolesRow}>
                {user.roles.map((role) => {
                  const badge = ROLE_COLORS[role as SchoolRole] ?? {
                    bg: colors.warmAccent,
                    text: colors.white,
                  };
                  return (
                    <View
                      key={role}
                      style={[
                        styles.profileRoleBadge,
                        { backgroundColor: badge.bg },
                      ]}
                    >
                      <Text
                        style={[styles.profileRoleText, { color: badge.text }]}
                      >
                        {ROLE_LABELS[role as SchoolRole] ?? role}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {/* Actions communes (masquées pour student-only) */}
              {user.hasAccount ? (
                <>
                  <View
                    style={[
                      styles.sectionDivider,
                      { borderTopColor: colors.warmBorder },
                    ]}
                  />
                  <CommonActionsFooter
                    member={user}
                    onMessagePress={handleSendMessage}
                    onEditRolesPress={handleOpenEditRoles}
                  />
                </>
              ) : null}
            </View>

            {isLoading ? (
              <View style={styles.loadingWrap} testID="user-detail-loading">
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.loadingText}>Chargement du profil…</Text>
              </View>
            ) : error ? (
              <View style={styles.errorWrap} testID="user-detail-error">
                <Ionicons
                  name="alert-circle-outline"
                  size={28}
                  color={colors.warmAccent}
                />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => void loadDetail()}
                >
                  <Text style={styles.retryText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View
                  style={styles.roleSectionsWrap}
                  testID="user-detail-role-sections"
                >
                  {renderRoleSections()}
                </View>

                {/* Contact — masqué pour student-only */}
                {user.hasAccount ? (
                  <View style={styles.section} testID="user-detail-contact">
                    <Text style={styles.sectionTitle}>Contact</Text>
                    <InfoRow
                      icon="mail-outline"
                      label="Adresse e-mail"
                      value={
                        (detail && "email" in detail ? detail.email : null) ??
                        user.email ??
                        "Non renseigné"
                      }
                      testID="user-detail-email"
                    />
                    <InfoRow
                      icon="call-outline"
                      label="Téléphone"
                      value={
                        (detail && "phone" in detail ? detail.phone : null) ??
                        user.phone ??
                        "Non renseigné"
                      }
                      testID="user-detail-phone"
                    />
                    {((detail && "gender" in detail ? detail.gender : null) ??
                    user.gender) ? (
                      <InfoRow
                        icon="person-outline"
                        label="Genre"
                        value={
                          GENDER_LABELS[
                            ((detail && "gender" in detail
                              ? detail.gender
                              : null) ?? user.gender)!
                          ] ?? "—"
                        }
                        testID="user-detail-gender"
                      />
                    ) : null}
                  </View>
                ) : null}

                {/* Activité — masquée pour student-only */}
                {user.hasAccount ? (
                  <View style={styles.section} testID="user-detail-activity">
                    <Text style={styles.sectionTitle}>Activité</Text>
                    <InfoRow
                      icon="calendar-outline"
                      label="Membre depuis"
                      value={formatDate(
                        (detail && "createdAt" in detail
                          ? detail.createdAt
                          : null) ?? user.createdAt,
                      )}
                      testID="user-detail-created-at"
                    />
                    {detail &&
                    "lastLoginAt" in detail &&
                    detail.lastLoginAt !== undefined ? (
                      <InfoRow
                        icon="log-in-outline"
                        label="Dernière connexion"
                        value={
                          detail.lastLoginAt
                            ? formatDateTime(detail.lastLoginAt)
                            : "Jamais connecté"
                        }
                        testID="user-detail-last-login"
                      />
                    ) : null}
                    <InfoRow
                      icon="shield-checkmark-outline"
                      label="Profil complété"
                      value={
                        ((detail && "profileCompleted" in detail
                          ? detail.profileCompleted
                          : null) ?? user.profileCompleted)
                          ? "Oui"
                          : "Non"
                      }
                      testID="user-detail-profile-completed"
                    />
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
        )}
      </View>

      {/* Sheet affichage credentials (accès créé / mot de passe réinitialisé) */}
      {credentialsDisplay ? (
        <CredentialDisplaySheet
          visible={!!credentialsDisplay}
          onClose={() => setCredentialsDisplay(null)}
          username={credentialsDisplay.username}
          temporaryPassword={credentialsDisplay.temporaryPassword}
          title={credentialsDisplay.title}
        />
      ) : null}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrap: {},

  // ── Forms (inline, no Modal) ────────────────────────────────────────────
  formsTabContent: {
    flex: 1,
  },
  heroWrapper: {
    padding: 16,
  },
  formsKeyboardArea: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 16,
  },
  formActionsBar: {
    backgroundColor: colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
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

  // Profile card
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  profileMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  profileFullName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  profileStatusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.warmHighlight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  profileStatusLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  profileRolesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  profileRoleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  profileRoleText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Body
  body: { flex: 1 },
  bodyContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },

  // Role sections wrapper
  roleSectionsWrap: { gap: 8 },

  // Role section
  roleSection: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  roleSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roleSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  roleSectionEmpty: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
  },

  // Divider inside section
  sectionDivider: {
    borderTopWidth: 1,
    marginTop: 2,
  },

  // Action footer inside section / profile card
  actionsFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  actionBtnLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Teacher
  teachingClassRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  teachingClassBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  teachingClassName: {
    fontSize: 13,
    fontWeight: "700",
  },
  teachingSubjects: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  subjectPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  subjectPillText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: "600",
  },

  // Person rows (parent child, student parent)
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  personNameFlex: { flex: 1 },
  personName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  personSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  classBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  childActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    paddingLeft: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },

  // Student
  studentClassRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  studentParentsBlock: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    paddingTop: 8,
  },
  studentParentsLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Staff
  staffFunctions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  staffFunctionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  staffFunctionText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "600",
  },

  // Section (contact / activité)
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },

  // InfoRow
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder + "60",
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.warmHighlight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
  },

  // Loading / Error
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorWrap: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },

  // EditRolesSheet
  roleCheckList: { gap: 8 },
  roleCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
  },
  roleCheckBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.warmBorder,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  roleCheckLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  rolesError: {
    fontSize: 12,
    color: "#B84A3B",
    marginTop: 4,
  },

  // AssignChildToParentSheet
  searchInput: {
    backgroundColor: colors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.textPrimary,
    fontSize: 14,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  newParentForm: {
    gap: 16,
    marginTop: 16,
  },
  modeChip: {
    flex: 1,
    borderRadius: 6,
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
  studentList: { gap: 6, marginTop: 8 },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    gap: 10,
  },
  studentRowSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EEF5FB",
  },
  studentRowText: { flex: 1, gap: 2 },
  studentName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  studentNameSelected: { color: colors.primary },
  studentClass: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  noStudents: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 12,
    fontStyle: "italic",
  },
});
