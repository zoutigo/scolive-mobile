import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { schoolsApi } from "../../api/schools.api";
import { ConfirmDialog } from "../ConfirmDialog";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import {
  CompactSelectField,
  FormActions,
  TextFormField,
  styles as sharedFormStyles,
} from "../teachers/TeacherSheetCommons";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  SectionCard,
} from "../timetable/TimetableCommon";
import { colors } from "../../theme";
import { extractApiError } from "../../utils/api-error";
import type {
  CreateSchoolPayload,
  SchoolCycle,
  SchoolLanguageSystem,
  SchoolRow,
  UpdateSchoolPayload,
} from "../../types/schools.types";
import { moduleBack } from "../../utils/moduleBack";

type TabKey = "list" | "create" | "help";

const CYCLE_OPTIONS = [
  { value: "PRIMARY", label: "Primaire" },
  { value: "SECONDARY", label: "Secondaire" },
];

const LANGUAGE_SYSTEM_OPTIONS = [
  { value: "FRANCOPHONE", label: "Francophone" },
  { value: "ANGLOPHONE", label: "Anglophone" },
  { value: "BILINGUAL", label: "Bilingue" },
];

function roleAllowsPlatformAdmin(role: string | null | undefined) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

const CREATE_SCHOOL_FORM_SCHEMA = z.object({
  name: z.string().trim().min(1, "Le nom de l'école est obligatoire."),
  country: z.string().trim().optional(),
  region: z.string().trim().optional(),
  city: z.string().trim().optional(),
  cycle: z.union([z.literal("PRIMARY"), z.literal("SECONDARY"), z.literal("")]),
  languageSystem: z.union([
    z.literal("FRANCOPHONE"),
    z.literal("ANGLOPHONE"),
    z.literal("BILINGUAL"),
    z.literal(""),
  ]),
  schoolAdminEmail: z
    .string()
    .trim()
    .email("L'email du school admin est invalide."),
});

const EDIT_SCHOOL_FORM_SCHEMA = z.object({
  name: z.string().trim().min(1, "Le nom de l'école est obligatoire."),
  country: z.string().trim().optional(),
  region: z.string().trim().optional(),
  city: z.string().trim().optional(),
  cycle: z.union([z.literal("PRIMARY"), z.literal("SECONDARY"), z.literal("")]),
  languageSystem: z.union([
    z.literal("FRANCOPHONE"),
    z.literal("ANGLOPHONE"),
    z.literal("BILINGUAL"),
    z.literal(""),
  ]),
});

const ADD_ADMIN_FORM_SCHEMA = z.object({
  email: z.string().trim().email("L'email du school admin est invalide."),
});

function CreateSchoolForm(props: {
  isSubmitting: boolean;
  onSubmit: (values: CreateSchoolPayload) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    setFocus: focusField,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof CREATE_SCHOOL_FORM_SCHEMA>>({
    resolver: zodResolver(CREATE_SCHOOL_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: {
      name: "",
      country: "",
      region: "",
      city: "",
      cycle: "",
      languageSystem: "",
      schoolAdminEmail: "",
    },
  });

  const submit = handleSubmit(
    async (values) => {
      await props.onSubmit({
        name: values.name,
        country: values.country || undefined,
        region: values.region || undefined,
        city: values.city || undefined,
        cycle: values.cycle || undefined,
        languageSystem: values.languageSystem || undefined,
        schoolAdminEmail: values.schoolAdminEmail,
      });
      reset({
        name: "",
        country: "",
        region: "",
        city: "",
        cycle: "",
        languageSystem: "",
        schoolAdminEmail: "",
      });
    },
    (errs) => {
      const first = Object.keys(errs)[0];
      if (first) focusField(first as Parameters<typeof focusField>[0]);
    },
  );

  return (
    <View style={styles.form} testID="schools-create-form">
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Nom de l'école"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ex: Collège Vogt"
            error={errors.name?.message}
            testID="schools-create-name"
          />
        )}
      />
      <Controller
        control={control}
        name="country"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Pays"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ex: Cameroun"
            testID="schools-create-country"
          />
        )}
      />
      <Controller
        control={control}
        name="region"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Région"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ex: Centre"
            testID="schools-create-region"
          />
        )}
      />
      <Controller
        control={control}
        name="city"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Ville"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ex: Yaoundé"
            testID="schools-create-city"
          />
        )}
      />
      <Controller
        control={control}
        name="cycle"
        render={({ field: { value, onChange } }) => (
          <CompactSelectField
            label="Cycle"
            value={value}
            onChange={(next) => onChange(next as "" | SchoolCycle)}
            options={CYCLE_OPTIONS}
            placeholder="Sélectionner un cycle"
            testID="schools-create-cycle"
          />
        )}
      />
      <Controller
        control={control}
        name="languageSystem"
        render={({ field: { value, onChange } }) => (
          <CompactSelectField
            label="Système linguistique"
            value={value}
            onChange={(next) => onChange(next as "" | SchoolLanguageSystem)}
            options={LANGUAGE_SYSTEM_OPTIONS}
            placeholder="Sélectionner un système"
            testID="schools-create-language-system"
          />
        )}
      />
      <Controller
        control={control}
        name="schoolAdminEmail"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Email du school admin"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="admin@ecole.cm"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.schoolAdminEmail?.message}
            testID="schools-create-admin-email"
          />
        )}
      />
      <TouchableOpacity
        style={[
          sharedFormStyles.primaryAction,
          props.isSubmitting && sharedFormStyles.primaryActionDisabled,
        ]}
        disabled={props.isSubmitting}
        onPress={submit}
        testID="schools-create-submit"
      >
        <Text style={sharedFormStyles.primaryActionLabel}>
          {props.isSubmitting ? "Création..." : "Créer l'école"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function EditSchoolForm(props: {
  school: SchoolRow;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: UpdateSchoolPayload) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof EDIT_SCHOOL_FORM_SCHEMA>>({
    resolver: zodResolver(EDIT_SCHOOL_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: {
      name: props.school.name,
      country: props.school.country ?? "",
      region: props.school.region ?? "",
      city: props.school.city ?? "",
      cycle: props.school.cycle ?? "",
      languageSystem: props.school.languageSystem ?? "",
    },
  });

  const submit = handleSubmit((values) =>
    props.onSubmit({
      name: values.name,
      country: values.country || null,
      region: values.region || null,
      city: values.city || null,
      cycle: values.cycle || null,
      languageSystem: values.languageSystem || null,
    }),
  );

  return (
    <View style={styles.form} testID={`schools-edit-form-${props.school.id}`}>
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Nom de l'école"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ex: Collège Vogt"
            error={errors.name?.message}
            testID="schools-edit-name"
          />
        )}
      />
      <Controller
        control={control}
        name="country"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Pays"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ex: Cameroun"
            testID="schools-edit-country"
          />
        )}
      />
      <Controller
        control={control}
        name="region"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Région"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ex: Centre"
            testID="schools-edit-region"
          />
        )}
      />
      <Controller
        control={control}
        name="city"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Ville"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ex: Yaoundé"
            testID="schools-edit-city"
          />
        )}
      />
      <Controller
        control={control}
        name="cycle"
        render={({ field: { value, onChange } }) => (
          <CompactSelectField
            label="Cycle"
            value={value}
            onChange={(next) => onChange(next as "" | SchoolCycle)}
            options={CYCLE_OPTIONS}
            placeholder="Sélectionner un cycle"
            testID="schools-edit-cycle"
          />
        )}
      />
      <Controller
        control={control}
        name="languageSystem"
        render={({ field: { value, onChange } }) => (
          <CompactSelectField
            label="Système linguistique"
            value={value}
            onChange={(next) => onChange(next as "" | SchoolLanguageSystem)}
            options={LANGUAGE_SYSTEM_OPTIONS}
            placeholder="Sélectionner un système"
            testID="schools-edit-language-system"
          />
        )}
      />
      <FormActions
        submitLabel="Enregistrer"
        isSubmitting={props.isSubmitting}
        onCancel={props.onCancel}
        onSubmit={submit}
        testIDPrefix="schools-edit"
      />
    </View>
  );
}

function AddSchoolAdminForm(props: {
  isSubmitting: boolean;
  onSubmit: (email: string) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof ADD_ADMIN_FORM_SCHEMA>>({
    resolver: zodResolver(ADD_ADMIN_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  const submit = handleSubmit(async (values) => {
    await props.onSubmit(values.email);
    reset({ email: "" });
  });

  return (
    <View style={styles.addAdminForm} testID="schools-add-admin-form">
      <Text style={styles.addAdminTitle}>Ajouter un school admin</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Email du school admin"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="admin@ecole.cm"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
            testID="schools-add-admin-email"
          />
        )}
      />
      <TouchableOpacity
        style={[
          sharedFormStyles.secondaryAction,
          { flex: undefined, alignSelf: "flex-start", paddingHorizontal: 18 },
          props.isSubmitting && sharedFormStyles.primaryActionDisabled,
        ]}
        disabled={props.isSubmitting}
        onPress={submit}
        testID="schools-add-admin-submit"
      >
        <Text style={sharedFormStyles.secondaryActionLabel}>
          {props.isSubmitting ? "Ajout..." : "Ajouter"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function SchoolsAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [tab, setTab] = useState<TabKey>("list");
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isSubmittingAddAdmin, setIsSubmittingAddAdmin] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");

  const role = user?.activeRole ?? user?.role ?? null;
  const isAllowed = roleAllowsPlatformAdmin(role);

  const load = useCallback(async () => {
    setErrorMessage(null);
    try {
      const rows = await schoolsApi.listSchools();
      setSchools(rows);
    } catch (error) {
      setErrorMessage(extractApiError(error));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAllowed) {
      setIsLoading(false);
      return;
    }
    void load();
  }, [load, isAllowed]);

  const orderedSchools = useMemo(
    () => [...schools].sort((a, b) => a.name.localeCompare(b.name)),
    [schools],
  );
  const filteredSchools = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orderedSchools;
    return orderedSchools.filter((school) =>
      [school.name, school.slug, school.city, school.region, school.country]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [orderedSchools, search]);

  const handleCreate = useCallback(
    async (values: CreateSchoolPayload) => {
      setIsSubmittingCreate(true);
      try {
        const result = await schoolsApi.createSchool(values);
        showSuccess({
          title: "École créée",
          message: result.userExisted
            ? "L'école a été créée et rattachée au school admin existant."
            : "L'école a été créée, un email a été envoyé au school admin.",
        });
        setTab("list");
        await load();
      } catch (error) {
        showError({
          title: "Création impossible",
          message: extractApiError(error),
        });
      } finally {
        setIsSubmittingCreate(false);
      }
    },
    [load, showSuccess, showError],
  );

  const handleUpdate = useCallback(
    async (schoolId: string, values: UpdateSchoolPayload) => {
      setIsSubmittingEdit(true);
      try {
        await schoolsApi.updateSchool(schoolId, values);
        showSuccess({
          title: "École modifiée",
          message: "Les changements ont été enregistrés.",
        });
        setEditingSchoolId(null);
        await load();
      } catch (error) {
        showError({
          title: "Modification impossible",
          message: extractApiError(error),
        });
      } finally {
        setIsSubmittingEdit(false);
      }
    },
    [load, showSuccess, showError],
  );

  const handleAddAdmin = useCallback(
    async (schoolId: string, email: string) => {
      setIsSubmittingAddAdmin(true);
      try {
        await schoolsApi.addSchoolAdmin(schoolId, { email });
        showSuccess({
          title: "School admin ajouté",
          message: "Le school admin a été rattaché à l'école.",
        });
      } catch (error) {
        showError({
          title: "Ajout impossible",
          message: extractApiError(error),
        });
      } finally {
        setIsSubmittingAddAdmin(false);
      }
    },
    [showSuccess, showError],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await schoolsApi.deleteSchool(deleteTarget.id);
      showSuccess({
        title: "École supprimée",
        message: "L'école a été retirée de la plateforme.",
      });
      setDeleteTarget(null);
      await load();
    } catch (error) {
      showError({
        title: "Suppression impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, load, showSuccess, showError]);

  if (!isAllowed) {
    return (
      <View style={styles.root}>
        <ModuleHeader
          title="Écoles"
          onBack={() => moduleBack(router)}
          testID="schools-header"
          topInset={insets.top}
        />
        <View style={styles.stateWrap}>
          <EmptyState
            icon="lock-closed-outline"
            title="Accès non autorisé"
            message="Ce module est réservé aux administrateurs de la plateforme."
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ModuleHeader
        title="Écoles"
        subtitle="Gestion des établissements de la plateforme"
        onBack={() => moduleBack(router)}
        testID="schools-header"
        topInset={insets.top}
        secondaryAction={
          tab === "list"
            ? {
                icon: "search-outline",
                onPress: () => setFiltersOpen((current) => !current),
                testID: "schools-search-toggle",
                accessibilityLabel: "Rechercher une école",
                active: filtersOpen,
              }
            : undefined
        }
      />

      <UnderlineTabs
        items={[
          { key: "list", label: "Liste" },
          { key: "create", label: "Créer" },
          { key: "help", label: "Aide" },
        ]}
        activeKey={tab}
        onSelect={setTab}
        testIDPrefix="schools-tab"
      />

      {tab === "list" && filtersOpen ? (
        <View style={styles.searchPanel} testID="schools-filter-panel">
          <TextFormField
            label="Recherche"
            value={search}
            onChangeText={setSearch}
            onBlur={() => {}}
            placeholder="Nom, slug, ville, région, pays..."
            testID="schools-filter-search-input"
          />
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.stateWrap}>
          <LoadingBlock label="Chargement des écoles..." />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {errorMessage ? (
            <ErrorBanner
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
              testID="schools-error-banner"
            />
          ) : null}

          {tab === "help" ? (
            <SectionCard title="Mode d'emploi" testID="schools-help-card">
              <Text style={styles.helpText}>
                Créez une école avec son école admin, modifiez ses informations
                (cycle, système linguistique) et ajoutez des school admins
                supplémentaires depuis l'édition d'une carte.
              </Text>
            </SectionCard>
          ) : tab === "create" ? (
            <SectionCard title="Nouvelle école" testID="schools-create-card">
              <CreateSchoolForm
                isSubmitting={isSubmittingCreate}
                onSubmit={handleCreate}
              />
            </SectionCard>
          ) : filteredSchools.length === 0 ? (
            <EmptyState
              icon="business-outline"
              title="Aucune école"
              message={
                search.trim()
                  ? "Aucune école ne correspond à la recherche."
                  : "Créez la première école de la plateforme."
              }
            />
          ) : (
            filteredSchools.map((school) => (
              <SectionCard key={school.id} testID={`schools-card-${school.id}`}>
                <Text style={styles.schoolName}>{school.name}</Text>
                <Text style={styles.schoolMeta}>{school.slug}</Text>
                <Text style={styles.schoolMeta}>
                  {[school.city, school.region, school.country]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </Text>
                <Text style={styles.schoolMeta}>
                  {[
                    school.cycle
                      ? CYCLE_OPTIONS.find(
                          (option) => option.value === school.cycle,
                        )?.label
                      : null,
                    school.languageSystem
                      ? LANGUAGE_SYSTEM_OPTIONS.find(
                          (option) => option.value === school.languageSystem,
                        )?.label
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "-"}
                </Text>
                <Text style={styles.schoolStats}>
                  {school.usersCount} utilisateurs · {school.classesCount}{" "}
                  classes · {school.studentsCount} élèves
                </Text>

                {editingSchoolId === school.id ? (
                  <>
                    <EditSchoolForm
                      school={school}
                      isSubmitting={isSubmittingEdit}
                      onCancel={() => setEditingSchoolId(null)}
                      onSubmit={(values) => handleUpdate(school.id, values)}
                    />
                    <AddSchoolAdminForm
                      isSubmitting={isSubmittingAddAdmin}
                      onSubmit={(email) => handleAddAdmin(school.id, email)}
                    />
                  </>
                ) : (
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={sharedFormStyles.secondaryAction}
                      onPress={() => setEditingSchoolId(school.id)}
                      testID={`schools-edit-${school.id}`}
                    >
                      <Text style={sharedFormStyles.secondaryActionLabel}>
                        Modifier
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={sharedFormStyles.secondaryAction}
                      onPress={() => setDeleteTarget(school)}
                      testID={`schools-delete-${school.id}`}
                    >
                      <Text style={sharedFormStyles.secondaryActionLabel}>
                        Supprimer
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </SectionCard>
            ))
          )}
        </ScrollView>
      )}

      <ConfirmDialog
        visible={deleteTarget != null}
        title="Supprimer l'école"
        message={
          deleteTarget
            ? `Supprimer définitivement l'école "${deleteTarget.name}" ?`
            : ""
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  searchPanel: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  form: {
    gap: 10,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  schoolMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  schoolStats: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  addAdminForm: {
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
  },
  addAdminTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
