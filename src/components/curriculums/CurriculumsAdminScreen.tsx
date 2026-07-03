import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { curriculumsApi } from "../../api/curriculums.api";
import { ConfirmDialog } from "../ConfirmDialog";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
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
import type {
  CreateAcademicLevelPayload,
  CreateCurriculumPayload,
  CreateTrackPayload,
  CurriculumAcademicLevel,
  CurriculumRow,
  CurriculumSubjectCatalogItem,
  CurriculumSubjectRow,
  CurriculumTrack,
  UpdateAcademicLevelPayload,
  UpdateTrackPayload,
  UpsertCurriculumSubjectPayload,
} from "../../types/curriculums.types";
import { moduleBack } from "../../utils/moduleBack";

type TabKey = "levels" | "tracks" | "curriculums" | "subjects" | "help";

type DeleteTarget =
  | { kind: "level"; id: string; label: string }
  | { kind: "track"; id: string; label: string }
  | { kind: "curriculum"; id: string; label: string }
  | {
      kind: "curriculum-subject";
      curriculumId: string;
      subjectId: string;
      label: string;
    };

type LevelTrackSheetMode = "create" | "edit";
type LevelTrackSheetKind = "level" | "track";

type LevelTrackSheetState = {
  visible: boolean;
  kind: LevelTrackSheetKind;
  mode: LevelTrackSheetMode;
  itemId?: string;
  initialValues?: {
    code: string;
    label: string;
  };
};

type CurriculumSheetState = {
  visible: boolean;
  mode: "create" | "edit";
  item?: CurriculumRow | null;
};

type CurriculumSubjectSheetState = {
  visible: boolean;
  mode: "create" | "edit";
  item?: CurriculumSubjectRow | null;
};

const TAB_ITEMS = [
  { key: "levels", label: "Niveaux" },
  { key: "tracks", label: "Filières" },
  { key: "curriculums", label: "Curriculums" },
  { key: "subjects", label: "Matières" },
  { key: "help", label: "Aide" },
] as const;

const LEVEL_TRACK_FORM_SCHEMA = z.object({
  code: z.string().trim().min(1, "Le code est obligatoire."),
  label: z.string().trim().min(1, "Le libellé est obligatoire."),
});

const CURRICULUM_FORM_SCHEMA = z.object({
  academicLevelId: z
    .string()
    .trim()
    .min(1, "Le niveau académique est obligatoire."),
  trackId: z.string().trim().optional(),
});

const CURRICULUM_SUBJECT_FORM_SCHEMA = z.object({
  curriculumId: z.string().trim().min(1, "Choisissez un curriculum."),
  subjectId: z.string().trim().min(1, "Choisissez une matière."),
  coefficient: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      "Le coefficient doit être positif.",
    ),
  weeklyHours: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      "Les heures doivent être positives.",
    ),
  isMandatory: z.boolean(),
});

function normalizeOptionalNumber(value?: string) {
  if (!value || value.trim() === "") {
    return undefined;
  }
  return Number(value);
}

function buildCurriculumNamePreview(params: {
  academicLevelId: string;
  trackId?: string;
  academicLevels: CurriculumAcademicLevel[];
  tracks: CurriculumTrack[];
}) {
  const level = params.academicLevels.find(
    (entry) => entry.id === params.academicLevelId,
  );
  if (!level) return "Sélectionnez un niveau";
  const track = params.tracks.find((entry) => entry.id === params.trackId);
  return `${level.code} - ${track?.code ?? "TRONC_COMMUN"}`;
}

function formatCount(value: number, singular: string, plural?: string) {
  return `${value} ${value > 1 ? (plural ?? `${singular}s`) : singular}`;
}

function accentForTab(tab: TabKey) {
  switch (tab) {
    case "levels":
      return "#D89B5B";
    case "tracks":
      return "#247C72";
    case "curriculums":
      return "#0C5FA8";
    case "subjects":
      return "#E07B2A";
    case "help":
      return "#7A5C3E";
  }
}

function rowPaletteForTab(tab: Exclude<TabKey, "help">, index: number) {
  const palettes: Record<Exclude<TabKey, "help">, [string, string]> = {
    levels: ["#FFF9F3", "#FFF2E4"],
    tracks: ["#F4FCFA", "#EAF7F4"],
    curriculums: ["#F5FAFF", "#ECF4FB"],
    subjects: ["#FFF7F0", "#FFF0E1"],
  };

  const [base, alternate] = palettes[tab];
  return {
    backgroundColor: index % 2 === 0 ? base : alternate,
    accentColor: accentForTab(tab),
  };
}

function alternateCard(index: number) {
  return index % 2 === 0 ? colors.surface : "#FFF8F0";
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
  const { height: windowHeight } = useWindowDimensions();

  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="slide"
      onRequestClose={props.onClose}
    >
      <View style={styles.sheetOverlay}>
        {/* Backdrop plein écran — absolu pour ne pas interférer avec le flex de la carte */}
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={props.onClose}
        />
        {/*
          Sur Android Fabric, flex:1 dans un parent sans hauteur explicite = 0.
          On laisse le KAV (et la carte) s'auto-dimensionner au contenu,
          et on borne le ScrollView via maxHeight calculé dynamiquement.
        */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetKeyboard}
        >
          <View style={styles.sheetCard} testID={props.testID}>
            <View style={styles.sheetHeader} testID={`${props.testID}-header`}>
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
                  style={styles.sheetCloseButton}
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
              style={[
                styles.sheetScrollArea,
                { maxHeight: windowHeight * 0.55 },
              ]}
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
  keyboardType?: "default" | "numeric";
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
  label?: string;
  value: string;
  options: Array<{ value: string; label: string; meta?: string }>;
  placeholder?: string;
  onChange: (value: string) => void;
  testID: string;
  error?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected =
    props.options.find((option) => option.value === props.value) ?? null;

  return (
    <View style={styles.formField}>
      {props.label ? <Text style={styles.formLabel}>{props.label}</Text> : null}
      <TouchableOpacity
        style={[
          styles.compactSelectTrigger,
          props.error ? styles.compactSelectTriggerError : null,
          props.disabled ? styles.compactSelectTriggerDisabled : null,
        ]}
        onPress={() => {
          if (!props.disabled) {
            setOpen(true);
          }
        }}
        disabled={props.disabled}
        testID={props.testID}
      >
        <View style={styles.compactSelectTextWrap}>
          <Text style={styles.compactSelectValue} numberOfLines={1}>
            {selected?.label ?? props.placeholder ?? "Sélectionner…"}
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
            <Text
              style={styles.selectSheetTitle}
              testID={`${props.testID}-sheet-title`}
            >
              {props.label ?? "Sélection"}
            </Text>
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
  onCancel: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
  testIDPrefix: string;
}) {
  return (
    <View
      style={styles.formActions}
      testID={`${props.testIDPrefix}-action-bar`}
    >
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
          (props.submitDisabled || props.isSubmitting) &&
            styles.primaryActionDisabled,
        ]}
        disabled={props.submitDisabled || props.isSubmitting}
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

function LevelTrackFormSheet(props: {
  visible: boolean;
  kind: LevelTrackSheetKind;
  mode: LevelTrackSheetMode;
  initialValues?: {
    code: string;
    label: string;
  };
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (
    values: CreateAcademicLevelPayload | CreateTrackPayload,
  ) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    reset,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof LEVEL_TRACK_FORM_SCHEMA>>({
    resolver: zodResolver(LEVEL_TRACK_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: {
      code: props.initialValues?.code ?? "",
      label: props.initialValues?.label ?? "",
    },
  });

  useEffect(() => {
    if (!props.visible) return;
    reset({
      code: props.initialValues?.code ?? "",
      label: props.initialValues?.label ?? "",
    });
  }, [
    props.initialValues?.code,
    props.initialValues?.label,
    props.visible,
    reset,
  ]);

  const title =
    props.kind === "level" ? "Niveau académique" : "Filière académique";
  const actionLabel =
    props.mode === "create"
      ? props.kind === "level"
        ? "Créer le niveau"
        : "Créer la filière"
      : "Enregistrer";

  return (
    <ModalFrame
      visible={props.visible}
      onClose={props.onClose}
      title={title}
      eyebrow={props.mode === "create" ? "Création" : "Modification"}
      subtitle={
        props.kind === "level"
          ? "Définissez un repère académique clair pour organiser les classes et les programmes."
          : "Structurez les parcours proposés avec une dénomination claire et réutilisable."
      }
      testID={`curriculum-${props.kind}-form-sheet`}
      footer={
        <FormActions
          submitLabel={actionLabel}
          isSubmitting={props.isSubmitting}
          onCancel={props.onClose}
          onSubmit={() =>
            void handleSubmit(
              async (values) => props.onSubmit(values),
              (errs) => {
                const first = Object.keys(errs)[0];
                if (first)
                  focusField(first as Parameters<typeof focusField>[0]);
              },
            )()
          }
          testIDPrefix={`curriculum-${props.kind}-form`}
        />
      }
    >
      <Controller
        control={control}
        name="code"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Code"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={props.kind === "level" ? "Ex: 6EME" : "Ex: C"}
            error={errors.code?.message}
            testID={`curriculum-${props.kind}-code-input`}
          />
        )}
      />
      <Controller
        control={control}
        name="label"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Libellé"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={
              props.kind === "level" ? "Ex: Sixième" : "Ex: Scientifique"
            }
            error={errors.label?.message}
            testID={`curriculum-${props.kind}-label-input`}
          />
        )}
      />
    </ModalFrame>
  );
}

function CurriculumFormSheet(props: {
  visible: boolean;
  item?: CurriculumRow | null;
  academicLevels: CurriculumAcademicLevel[];
  tracks: CurriculumTrack[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: CreateCurriculumPayload) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof CURRICULUM_FORM_SCHEMA>>({
    resolver: zodResolver(CURRICULUM_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: {
      academicLevelId: props.item?.academicLevelId ?? "",
      trackId: props.item?.trackId ?? "",
    },
  });

  const values = watch();

  useEffect(() => {
    if (!props.visible) return;
    reset({
      academicLevelId:
        props.item?.academicLevelId ?? props.academicLevels[0]?.id ?? "",
      trackId: props.item?.trackId ?? "",
    });
  }, [
    props.visible,
    props.item?.academicLevelId,
    props.item?.trackId,
    props.academicLevels,
    reset,
  ]);

  const previewName = buildCurriculumNamePreview({
    academicLevelId: values.academicLevelId,
    trackId: values.trackId,
    academicLevels: props.academicLevels,
    tracks: props.tracks,
  });

  return (
    <ModalFrame
      visible={props.visible}
      onClose={props.onClose}
      title="Curriculum"
      eyebrow={props.item ? "Modification" : "Création"}
      subtitle="Assemblez un niveau et une filière dans un formulaire compact pour produire un intitulé cohérent."
      testID="curriculum-form-sheet"
      footer={
        <FormActions
          submitLabel={props.item ? "Enregistrer" : "Créer le curriculum"}
          isSubmitting={props.isSubmitting}
          onCancel={props.onClose}
          onSubmit={() =>
            void handleSubmit(
              async (formValues) =>
                props.onSubmit({
                  academicLevelId: formValues.academicLevelId,
                  trackId: formValues.trackId?.trim()
                    ? formValues.trackId.trim()
                    : undefined,
                }),
              (errs) => {
                const first = Object.keys(errs)[0];
                if (first)
                  focusField(first as Parameters<typeof focusField>[0]);
              },
            )()
          }
          testIDPrefix="curriculum-form"
        />
      }
    >
      <Controller
        control={control}
        name="academicLevelId"
        render={({ field: { value, onChange } }) => (
          <CompactSelectField
            label="Niveau académique"
            value={value}
            onChange={onChange}
            options={props.academicLevels.map((level) => ({
              value: level.id,
              label: level.label,
              meta: level.code,
            }))}
            testID="curriculum-form-level"
            error={errors.academicLevelId?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="trackId"
        render={({ field: { value, onChange } }) => (
          <CompactSelectField
            label="Filière"
            value={value ?? ""}
            onChange={onChange}
            options={[
              {
                value: "",
                label: "Tronc commun",
                meta: "Sans filière dédiée",
              },
              ...props.tracks.map((track) => ({
                value: track.id,
                label: track.label,
                meta: track.code,
              })),
            ]}
            testID="curriculum-form-track"
          />
        )}
      />
      <View style={styles.previewCard}>
        <Text style={styles.previewLabel}>Nom généré automatiquement</Text>
        <Text style={styles.previewValue} testID="curriculum-form-name-preview">
          {previewName}
        </Text>
      </View>
    </ModalFrame>
  );
}

function CurriculumSubjectFormSheet(props: {
  visible: boolean;
  item?: CurriculumSubjectRow | null;
  selectedCurriculumId: string;
  curriculums: CurriculumRow[];
  subjects: CurriculumSubjectCatalogItem[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (
    curriculumId: string,
    values: UpsertCurriculumSubjectPayload,
  ) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    reset,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof CURRICULUM_SUBJECT_FORM_SCHEMA>>({
    resolver: zodResolver(CURRICULUM_SUBJECT_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: {
      curriculumId: props.selectedCurriculumId,
      subjectId: props.item?.subjectId ?? "",
      coefficient:
        props.item?.coefficient != null ? String(props.item.coefficient) : "",
      weeklyHours:
        props.item?.weeklyHours != null ? String(props.item.weeklyHours) : "",
      isMandatory: props.item?.isMandatory ?? true,
    },
  });

  useEffect(() => {
    if (!props.visible) return;
    reset({
      curriculumId: props.selectedCurriculumId,
      subjectId: props.item?.subjectId ?? "",
      coefficient:
        props.item?.coefficient != null ? String(props.item.coefficient) : "",
      weeklyHours:
        props.item?.weeklyHours != null ? String(props.item.weeklyHours) : "",
      isMandatory: props.item?.isMandatory ?? true,
    });
  }, [
    props.visible,
    props.selectedCurriculumId,
    props.item?.subjectId,
    props.item?.coefficient,
    props.item?.weeklyHours,
    props.item?.isMandatory,
    reset,
  ]);

  return (
    <ModalFrame
      visible={props.visible}
      onClose={props.onClose}
      title="Matière du curriculum"
      eyebrow={props.item ? "Modification" : "Ajout"}
      subtitle="Sélectionnez rapidement le curriculum et la matière, puis ajustez les paramètres pédagogiques."
      testID="curriculum-subject-form-sheet"
      footer={
        <FormActions
          submitLabel={props.item ? "Enregistrer" : "Ajouter la matière"}
          isSubmitting={props.isSubmitting}
          onCancel={props.onClose}
          onSubmit={() =>
            void handleSubmit(
              async (values) => {
                await props.onSubmit(values.curriculumId, {
                  subjectId: values.subjectId,
                  isMandatory: values.isMandatory,
                  coefficient: normalizeOptionalNumber(values.coefficient),
                  weeklyHours: normalizeOptionalNumber(values.weeklyHours),
                });
              },
              (errs) => {
                const first = Object.keys(errs)[0];
                if (first)
                  focusField(first as Parameters<typeof focusField>[0]);
              },
            )()
          }
          testIDPrefix="curriculum-subject-form"
        />
      }
    >
      <Controller
        control={control}
        name="curriculumId"
        render={({ field: { value, onChange } }) => (
          <CompactSelectField
            label="Curriculum"
            value={value}
            onChange={onChange}
            options={props.curriculums.map((curriculum) => ({
              value: curriculum.id,
              label: curriculum.name,
              meta: `${formatCount(curriculum._count.subjects, "matière")} · ${formatCount(
                curriculum._count.classes,
                "classe",
              )}`,
            }))}
            testID="curriculum-subject-form-curriculum"
            error={errors.curriculumId?.message}
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
            onChange={onChange}
            options={props.subjects.map((subject) => ({
              value: subject.id,
              label: subject.name,
              meta:
                subject._count?.curriculumSubjects != null
                  ? formatCount(subject._count.curriculumSubjects, "curriculum")
                  : undefined,
            }))}
            testID="curriculum-subject-form-subject"
            error={errors.subjectId?.message}
            disabled={!!props.item}
          />
        )}
      />
      <Controller
        control={control}
        name="coefficient"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Coefficient"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ex: 4"
            keyboardType="numeric"
            error={errors.coefficient?.message}
            testID="curriculum-subject-form-coefficient"
          />
        )}
      />
      <Controller
        control={control}
        name="weeklyHours"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Heures / semaine"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ex: 3"
            keyboardType="numeric"
            error={errors.weeklyHours?.message}
            testID="curriculum-subject-form-weekly-hours"
          />
        )}
      />
      <Controller
        control={control}
        name="isMandatory"
        render={({ field: { value, onChange } }) => (
          <View style={styles.switchField}>
            <View style={styles.switchFieldText}>
              <Text style={styles.formLabel}>Matière obligatoire</Text>
              <Text style={styles.switchFieldHint}>
                Désactivez pour une matière optionnelle.
              </Text>
            </View>
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{
                false: colors.warmBorder,
                true: colors.accentTeal,
              }}
              thumbColor={colors.white}
              testID="curriculum-subject-form-mandatory"
            />
          </View>
        )}
      />
    </ModalFrame>
  );
}

export function CurriculumsAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { schoolSlug, user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [tab, setTab] = useState<TabKey>("curriculums");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [levels, setLevels] = useState<CurriculumAcademicLevel[]>([]);
  const [tracks, setTracks] = useState<CurriculumTrack[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumRow[]>([]);
  const [subjects, setSubjects] = useState<CurriculumSubjectCatalogItem[]>([]);
  const [curriculumSubjects, setCurriculumSubjects] = useState<
    CurriculumSubjectRow[]
  >([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");
  const [levelTrackSheet, setLevelTrackSheet] = useState<LevelTrackSheetState>({
    visible: false,
    kind: "level",
    mode: "create",
  });
  const [curriculumSheet, setCurriculumSheet] = useState<CurriculumSheetState>({
    visible: false,
    mode: "create",
  });
  const [curriculumSubjectSheet, setCurriculumSubjectSheet] =
    useState<CurriculumSubjectSheetState>({
      visible: false,
      mode: "create",
    });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const role = user?.activeRole ?? user?.role ?? null;
  const isAllowed =
    role === "SCHOOL_ADMIN" || role === "ADMIN" || role === "SUPER_ADMIN";
  const subtitle = user ? buildAdminSubtitle(user) : null;

  const orderedLevels = useMemo(
    () => [...levels].sort((a, b) => a.code.localeCompare(b.code)),
    [levels],
  );
  const orderedTracks = useMemo(
    () => [...tracks].sort((a, b) => a.code.localeCompare(b.code)),
    [tracks],
  );
  const orderedCurriculums = useMemo(
    () => [...curriculums].sort((a, b) => a.name.localeCompare(b.name)),
    [curriculums],
  );
  const orderedCurriculumSubjects = useMemo(
    () =>
      [...curriculumSubjects].sort((a, b) =>
        a.subject.name.localeCompare(b.subject.name),
      ),
    [curriculumSubjects],
  );
  const selectedCurriculum =
    orderedCurriculums.find((entry) => entry.id === selectedCurriculumId) ??
    null;
  const curriculumSelectOptions = useMemo(
    () =>
      orderedCurriculums.map((curriculum) => ({
        value: curriculum.id,
        label: curriculum.name,
        meta: `${formatCount(curriculum._count.subjects, "matière")} · ${formatCount(
          curriculum._count.classes,
          "classe",
        )}`,
      })),
    [orderedCurriculums],
  );

  const syncSelection = useCallback((list: CurriculumRow[]) => {
    setSelectedCurriculumId((current) => {
      if (list.length === 0) return "";
      if (current && list.some((entry) => entry.id === current)) {
        return current;
      }
      return list[0]?.id ?? "";
    });
  }, []);

  const loadOverview = useCallback(
    async (showSpinner = true) => {
      if (!schoolSlug) return;
      if (showSpinner) {
        setLoading(true);
      }
      setLoadError(null);
      try {
        const [levelRows, trackRows, subjectRows, curriculumRows] =
          await Promise.all([
            curriculumsApi.listAcademicLevels(schoolSlug),
            curriculumsApi.listTracks(schoolSlug),
            curriculumsApi.listSubjects(schoolSlug),
            curriculumsApi.listCurriculums(schoolSlug),
          ]);
        setLevels(levelRows);
        setTracks(trackRows);
        setSubjects(subjectRows);
        setCurriculums(curriculumRows);
        syncSelection(curriculumRows);
      } catch (error) {
        setLoadError(extractApiError(error));
      } finally {
        setLoading(false);
      }
    },
    [schoolSlug, syncSelection],
  );

  const loadSubjectsForCurriculum = useCallback(
    async (curriculumId: string) => {
      if (!schoolSlug || !curriculumId) {
        setCurriculumSubjects([]);
        return;
      }
      try {
        const rows = await curriculumsApi.listCurriculumSubjects(
          schoolSlug,
          curriculumId,
        );
        setCurriculumSubjects(rows);
      } catch (error) {
        setCurriculumSubjects([]);
        setLoadError(extractApiError(error));
      }
    },
    [schoolSlug],
  );

  useEffect(() => {
    if (!isAllowed || !schoolSlug) return;
    void loadOverview(true);
  }, [isAllowed, loadOverview, schoolSlug]);

  useEffect(() => {
    if (!isAllowed || !schoolSlug) return;
    if (tab !== "subjects") return;
    if (!selectedCurriculumId) {
      setCurriculumSubjects([]);
      return;
    }
    void loadSubjectsForCurriculum(selectedCurriculumId);
  }, [
    isAllowed,
    loadSubjectsForCurriculum,
    schoolSlug,
    selectedCurriculumId,
    tab,
  ]);

  const refreshAll = useCallback(async () => {
    if (!schoolSlug || !isAllowed) return;
    setRefreshing(true);
    await loadOverview(false);
    if (selectedCurriculumId && tab === "subjects") {
      await loadSubjectsForCurriculum(selectedCurriculumId);
    }
    setRefreshing(false);
  }, [
    isAllowed,
    loadOverview,
    loadSubjectsForCurriculum,
    schoolSlug,
    selectedCurriculumId,
    tab,
  ]);

  async function runMutation(
    action: () => Promise<void>,
    successTitle: string,
    successMessage: string,
    onDone?: () => void,
  ) {
    setIsSubmitting(true);
    try {
      await action();
      showSuccess({
        title: successTitle,
        message: successMessage,
      });
      onDone?.();
      await loadOverview(false);
      if (selectedCurriculumId) {
        await loadSubjectsForCurriculum(selectedCurriculumId);
      }
    } catch (error) {
      const message = extractApiError(error);
      showError({
        title: "Action impossible",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLevelTrackSubmit(
    values: CreateAcademicLevelPayload | CreateTrackPayload,
  ) {
    const sheet = levelTrackSheet;
    if (!schoolSlug) return;
    if (sheet.kind === "level") {
      await runMutation(
        async () => {
          if (sheet.mode === "create") {
            await curriculumsApi.createAcademicLevel(schoolSlug, values);
          } else if (sheet.itemId) {
            await curriculumsApi.updateAcademicLevel(
              schoolSlug,
              sheet.itemId,
              values as UpdateAcademicLevelPayload,
            );
          }
        },
        sheet.mode === "create" ? "Niveau créé" : "Niveau modifié",
        sheet.mode === "create"
          ? "Le niveau académique a été ajouté."
          : "Le niveau académique a été mis à jour.",
        () =>
          setLevelTrackSheet((current) => ({
            ...current,
            visible: false,
          })),
      );
      return;
    }

    await runMutation(
      async () => {
        if (sheet.mode === "create") {
          await curriculumsApi.createTrack(schoolSlug, values);
        } else if (sheet.itemId) {
          await curriculumsApi.updateTrack(
            schoolSlug,
            sheet.itemId,
            values as UpdateTrackPayload,
          );
        }
      },
      sheet.mode === "create" ? "Filière créée" : "Filière modifiée",
      sheet.mode === "create"
        ? "La filière a été ajoutée."
        : "La filière a été mise à jour.",
      () =>
        setLevelTrackSheet((current) => ({
          ...current,
          visible: false,
        })),
    );
  }

  async function handleCurriculumSubmit(values: CreateCurriculumPayload) {
    if (!schoolSlug) return;
    await runMutation(
      async () => {
        if (curriculumSheet.mode === "create") {
          await curriculumsApi.createCurriculum(schoolSlug, values);
        } else if (curriculumSheet.item?.id) {
          await curriculumsApi.updateCurriculum(
            schoolSlug,
            curriculumSheet.item.id,
            values,
          );
        }
      },
      curriculumSheet.mode === "create"
        ? "Curriculum créé"
        : "Curriculum modifié",
      curriculumSheet.mode === "create"
        ? "Le curriculum a été ajouté."
        : "Le curriculum a été mis à jour.",
      () => setCurriculumSheet({ visible: false, mode: "create" }),
    );
  }

  async function handleCurriculumSubjectSubmit(
    curriculumId: string,
    values: UpsertCurriculumSubjectPayload,
  ) {
    if (!schoolSlug) return;
    await runMutation(
      async () => {
        await curriculumsApi.upsertCurriculumSubject(
          schoolSlug,
          curriculumId,
          values,
        );
      },
      curriculumSubjectSheet.mode === "create"
        ? "Matière ajoutée"
        : "Matière modifiée",
      curriculumSubjectSheet.mode === "create"
        ? "La matière a été liée au curriculum."
        : "Les paramètres de la matière ont été mis à jour.",
      () => {
        setSelectedCurriculumId(curriculumId);
        setCurriculumSubjectSheet({ visible: false, mode: "create" });
      },
    );
  }

  async function confirmDelete() {
    if (!schoolSlug || !deleteTarget) return;
    const currentTarget = deleteTarget;
    setDeleteTarget(null);

    if (currentTarget.kind === "level") {
      await runMutation(
        async () => {
          await curriculumsApi.deleteAcademicLevel(
            schoolSlug,
            currentTarget.id,
          );
        },
        "Niveau supprimé",
        "Le niveau académique a été supprimé.",
      );
      return;
    }

    if (currentTarget.kind === "track") {
      await runMutation(
        async () => {
          await curriculumsApi.deleteTrack(schoolSlug, currentTarget.id);
        },
        "Filière supprimée",
        "La filière a été supprimée.",
      );
      return;
    }

    if (currentTarget.kind === "curriculum") {
      await runMutation(
        async () => {
          await curriculumsApi.deleteCurriculum(schoolSlug, currentTarget.id);
        },
        "Curriculum supprimé",
        "Le curriculum a été supprimé.",
      );
      return;
    }

    await runMutation(
      async () => {
        await curriculumsApi.deleteCurriculumSubject(
          schoolSlug,
          currentTarget.curriculumId,
          currentTarget.subjectId,
        );
      },
      "Matière retirée",
      "La matière a été retirée du curriculum.",
    );
  }

  function openCreateSheet() {
    if (tab === "levels") {
      setLevelTrackSheet({
        visible: true,
        kind: "level",
        mode: "create",
      });
      return;
    }
    if (tab === "tracks") {
      setLevelTrackSheet({
        visible: true,
        kind: "track",
        mode: "create",
      });
      return;
    }
    if (tab === "curriculums") {
      setCurriculumSheet({
        visible: true,
        mode: "create",
      });
      return;
    }
    if (tab === "subjects") {
      setCurriculumSubjectSheet({
        visible: true,
        mode: "create",
      });
    }
  }

  const fabDisabled =
    tab === "help" ||
    (tab === "subjects" && curriculums.length === 0) ||
    !isAllowed ||
    !schoolSlug;

  const helpCards = [
    {
      title: "Niveaux et filières",
      body: "Créez d'abord la structure académique de l'établissement. Ces références alimentent automatiquement la création des curriculums.",
    },
    {
      title: "Curriculums",
      body: "Un curriculum assemble un niveau et éventuellement une filière. Le nom est généré automatiquement pour rester cohérent avec le web.",
    },
    {
      title: "Matières",
      body: "Ajoutez ensuite les matières autorisées dans chaque curriculum, avec coefficient, volume horaire et caractère obligatoire.",
    },
  ];

  if (!schoolSlug) {
    return (
      <View style={styles.root}>
        <ModuleHeader
          title="Curriculums"
          subtitle={subtitle}
          onBack={() => moduleBack(router)}
          testID="curriculums-header"
          backTestID="curriculums-back-btn"
          topInset={insets.top}
        />
        <View style={styles.stateWrap}>
          <EmptyState
            icon="business-outline"
            title="École introuvable"
            message="Aucun établissement n'est sélectionné pour ce compte."
          />
        </View>
      </View>
    );
  }

  if (!isAllowed) {
    return (
      <View style={styles.root}>
        <ModuleHeader
          title="Curriculums"
          subtitle={subtitle ?? getPortalLabel(getViewType(user!))}
          onBack={() => moduleBack(router)}
          testID="curriculums-header"
          backTestID="curriculums-back-btn"
          topInset={insets.top}
        />
        <View style={styles.stateWrap}>
          <EmptyState
            icon="lock-closed-outline"
            title="Accès réservé"
            message="Ce module mobile est disponible pour les comptes school admin."
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ModuleHeader
        title="Curriculums"
        subtitle={subtitle}
        onBack={() => moduleBack(router)}
        testID="curriculums-header"
        backTestID="curriculums-back-btn"
        topInset={insets.top}
      />

      <UnderlineTabs
        items={[...TAB_ITEMS]}
        activeKey={tab}
        onSelect={setTab}
        testIDPrefix="curriculums-tab"
      />

      {loading ? (
        <View style={styles.stateWrap}>
          <LoadingBlock label="Chargement des curriculums..." />
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  void refreshAll();
                }}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {loadError ? (
              <ErrorBanner
                message={loadError}
                onDismiss={() => setLoadError(null)}
                testID="curriculums-error-banner"
              />
            ) : null}

            {tab === "help" ? (
              <SectionCard
                title="Mode d'emploi"
                subtitle="Même logique fonctionnelle que sur le web, adaptée au mobile"
                testID="curriculums-help-card"
              >
                <View style={styles.helpStack}>
                  {helpCards.map((card, index) => (
                    <View
                      key={card.title}
                      style={[
                        styles.helpCard,
                        { backgroundColor: alternateCard(index) },
                      ]}
                    >
                      <Text style={styles.helpCardTitle}>{card.title}</Text>
                      <Text style={styles.helpCardBody}>{card.body}</Text>
                    </View>
                  ))}
                </View>
              </SectionCard>
            ) : null}

            {tab === "levels" ? (
              <SectionCard
                title="Niveaux académiques"
                subtitle="Base de la structure pédagogique"
                testID="curriculums-levels-card"
              >
                {orderedLevels.length === 0 ? (
                  <EmptyState
                    icon="layers-outline"
                    title="Aucun niveau"
                    message="Ajoutez un premier niveau académique pour commencer."
                  />
                ) : (
                  <View style={styles.listStack}>
                    {orderedLevels.map((level, index) => (
                      <View
                        key={level.id}
                        style={[
                          styles.entityRow,
                          {
                            backgroundColor: rowPaletteForTab("levels", index)
                              .backgroundColor,
                          },
                        ]}
                        testID={`curriculum-level-row-${level.id}`}
                      >
                        <View
                          style={[
                            styles.entityAccent,
                            {
                              backgroundColor: rowPaletteForTab("levels", index)
                                .accentColor,
                            },
                          ]}
                        />
                        <View style={styles.entityMain}>
                          <View style={styles.entityTextWrap}>
                            <Text style={styles.entityTitle}>
                              {level.label}
                            </Text>
                            <Text style={styles.entityMeta}>
                              {level.code} ·{" "}
                              {formatCount(
                                level._count?.curriculums ?? 0,
                                "curriculum",
                              )}{" "}
                              ·{" "}
                              {formatCount(
                                level._count?.classes ?? 0,
                                "classe",
                              )}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.iconActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() =>
                              setLevelTrackSheet({
                                visible: true,
                                kind: "level",
                                mode: "edit",
                                itemId: level.id,
                                initialValues: {
                                  code: level.code,
                                  label: level.label,
                                },
                              })
                            }
                            testID={`curriculum-level-edit-${level.id}`}
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={18}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconButton, styles.iconButtonDanger]}
                            onPress={() =>
                              setDeleteTarget({
                                kind: "level",
                                id: level.id,
                                label: level.label,
                              })
                            }
                            testID={`curriculum-level-delete-${level.id}`}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={colors.warmAccent}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </SectionCard>
            ) : null}

            {tab === "tracks" ? (
              <SectionCard
                title="Filières"
                subtitle="Options et spécialisations par niveau"
                testID="curriculums-tracks-card"
              >
                {orderedTracks.length === 0 ? (
                  <EmptyState
                    icon="git-branch-outline"
                    title="Aucune filière"
                    message="Ajoutez une filière si votre établissement distingue plusieurs parcours."
                  />
                ) : (
                  <View style={styles.listStack}>
                    {orderedTracks.map((track, index) => (
                      <View
                        key={track.id}
                        style={[
                          styles.entityRow,
                          {
                            backgroundColor: rowPaletteForTab("tracks", index)
                              .backgroundColor,
                          },
                        ]}
                        testID={`curriculum-track-row-${track.id}`}
                      >
                        <View
                          style={[
                            styles.entityAccent,
                            {
                              backgroundColor: rowPaletteForTab("tracks", index)
                                .accentColor,
                            },
                          ]}
                        />
                        <View style={styles.entityMain}>
                          <View style={styles.entityTextWrap}>
                            <Text style={styles.entityTitle}>
                              {track.label}
                            </Text>
                            <Text style={styles.entityMeta}>
                              {track.code} ·{" "}
                              {formatCount(
                                track._count?.curriculums ?? 0,
                                "curriculum",
                              )}{" "}
                              ·{" "}
                              {formatCount(
                                track._count?.classes ?? 0,
                                "classe",
                              )}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.iconActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() =>
                              setLevelTrackSheet({
                                visible: true,
                                kind: "track",
                                mode: "edit",
                                itemId: track.id,
                                initialValues: {
                                  code: track.code,
                                  label: track.label,
                                },
                              })
                            }
                            testID={`curriculum-track-edit-${track.id}`}
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={18}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconButton, styles.iconButtonDanger]}
                            onPress={() =>
                              setDeleteTarget({
                                kind: "track",
                                id: track.id,
                                label: track.label,
                              })
                            }
                            testID={`curriculum-track-delete-${track.id}`}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={colors.warmAccent}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </SectionCard>
            ) : null}

            {tab === "curriculums" ? (
              <SectionCard
                title="Curriculums"
                subtitle="Assemblage d'un niveau, d'une filière et de matières officielles"
                testID="curriculums-card"
              >
                {orderedCurriculums.length === 0 ? (
                  <EmptyState
                    icon="albums-outline"
                    title="Aucun curriculum"
                    message="Créez un premier curriculum pour configurer les matières autorisées."
                  />
                ) : (
                  <View style={styles.listStack}>
                    {orderedCurriculums.map((curriculum, index) => (
                      <View
                        key={curriculum.id}
                        style={[
                          styles.entityRow,
                          {
                            backgroundColor: rowPaletteForTab(
                              "curriculums",
                              index,
                            ).backgroundColor,
                          },
                        ]}
                        testID={`curriculum-row-${curriculum.id}`}
                      >
                        <View
                          style={[
                            styles.entityAccent,
                            {
                              backgroundColor: rowPaletteForTab(
                                "curriculums",
                                index,
                              ).accentColor,
                            },
                          ]}
                        />
                        <TouchableOpacity
                          style={styles.entityMain}
                          activeOpacity={0.8}
                          onPress={() => {
                            setSelectedCurriculumId(curriculum.id);
                            setTab("subjects");
                          }}
                          testID={`curriculum-open-${curriculum.id}`}
                        >
                          <View style={styles.entityTextWrap}>
                            <Text style={styles.entityTitle}>
                              {curriculum.name}
                            </Text>
                            <Text style={styles.entityMeta}>
                              {curriculum.track?.code ?? "TRONC_COMMUN"} ·{" "}
                              {formatCount(
                                curriculum._count.subjects,
                                "matière",
                              )}{" "}
                              ·{" "}
                              {formatCount(curriculum._count.classes, "classe")}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.iconActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() =>
                              setCurriculumSheet({
                                visible: true,
                                mode: "edit",
                                item: curriculum,
                              })
                            }
                            testID={`curriculum-edit-${curriculum.id}`}
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={18}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.iconButton,
                              styles.iconButtonNeutral,
                            ]}
                            onPress={() => {
                              setSelectedCurriculumId(curriculum.id);
                              setTab("subjects");
                            }}
                            testID={`curriculum-subjects-${curriculum.id}`}
                          >
                            <Ionicons
                              name="chevron-forward-outline"
                              size={18}
                              color={colors.accentTeal}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconButton, styles.iconButtonDanger]}
                            onPress={() =>
                              setDeleteTarget({
                                kind: "curriculum",
                                id: curriculum.id,
                                label: curriculum.name,
                              })
                            }
                            testID={`curriculum-delete-${curriculum.id}`}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={colors.warmAccent}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </SectionCard>
            ) : null}

            {tab === "subjects" ? (
              <>
                <View
                  style={styles.subjectSelectorBar}
                  testID="curriculums-subjects-context-card"
                >
                  {orderedCurriculums.length === 0 ? (
                    <EmptyState
                      icon="albums-outline"
                      title="Aucun curriculum disponible"
                      message="Créez d'abord un curriculum avant d'y rattacher des matières."
                    />
                  ) : (
                    <CompactSelectField
                      value={selectedCurriculumId}
                      options={curriculumSelectOptions}
                      placeholder="Choisir un curriculum"
                      onChange={setSelectedCurriculumId}
                      testID="curriculum-selector"
                    />
                  )}
                </View>

                {selectedCurriculum ? (
                  <SectionCard
                    title="Matières"
                    subtitle={`${orderedCurriculumSubjects.length} matière(s)`}
                    testID="curriculums-subjects-card"
                  >
                    {orderedCurriculumSubjects.length === 0 ? (
                      <EmptyState
                        icon="library-outline"
                        title="Aucune matière liée"
                        message="Ajoutez des matières pour définir le contenu officiel de ce curriculum."
                      />
                    ) : (
                      <View style={styles.listStack}>
                        {orderedCurriculumSubjects.map((entry, index) => (
                          <View
                            key={entry.id}
                            style={[
                              styles.entityRow,
                              {
                                backgroundColor: rowPaletteForTab(
                                  "subjects",
                                  index,
                                ).backgroundColor,
                              },
                            ]}
                            testID={`curriculum-subject-row-${entry.id}`}
                          >
                            <View
                              style={[
                                styles.entityAccent,
                                {
                                  backgroundColor: rowPaletteForTab(
                                    "subjects",
                                    index,
                                  ).accentColor,
                                },
                              ]}
                            />
                            <View style={styles.entityMain}>
                              <View style={styles.entityTextWrap}>
                                <Text style={styles.entityTitle}>
                                  {entry.subject.name}
                                </Text>
                                <Text style={styles.entityMeta}>
                                  Coef. {entry.coefficient ?? "-"} ·{" "}
                                  {entry.weeklyHours ?? "-"} h/sem ·{" "}
                                  {entry.isMandatory
                                    ? "Obligatoire"
                                    : "Optionnelle"}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.iconActions}>
                              <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() =>
                                  setCurriculumSubjectSheet({
                                    visible: true,
                                    mode: "edit",
                                    item: entry,
                                  })
                                }
                                testID={`curriculum-subject-edit-${entry.id}`}
                              >
                                <Ionicons
                                  name="pencil-outline"
                                  size={18}
                                  color={colors.primary}
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.iconButton,
                                  styles.iconButtonDanger,
                                ]}
                                onPress={() =>
                                  setDeleteTarget({
                                    kind: "curriculum-subject",
                                    curriculumId: selectedCurriculum.id,
                                    subjectId: entry.subjectId,
                                    label: entry.subject.name,
                                  })
                                }
                                testID={`curriculum-subject-delete-${entry.id}`}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={18}
                                  color={colors.warmAccent}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </SectionCard>
                ) : null}
              </>
            ) : null}
          </ScrollView>

          {tab !== "help" ? (
            <TouchableOpacity
              style={[
                styles.fab,
                {
                  bottom: insets.bottom + 20 + BOTTOM_TAB_BAR_HEIGHT,
                  backgroundColor: fabDisabled
                    ? colors.textSecondary
                    : accentForTab(tab),
                },
              ]}
              disabled={fabDisabled}
              onPress={openCreateSheet}
              activeOpacity={0.88}
              testID="curriculums-fab"
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Ionicons name="add" size={28} color={colors.white} />
              )}
            </TouchableOpacity>
          ) : null}
        </>
      )}

      <LevelTrackFormSheet
        visible={levelTrackSheet.visible}
        kind={levelTrackSheet.kind}
        mode={levelTrackSheet.mode}
        initialValues={levelTrackSheet.initialValues}
        isSubmitting={isSubmitting}
        onClose={() =>
          setLevelTrackSheet((current) => ({ ...current, visible: false }))
        }
        onSubmit={handleLevelTrackSubmit}
      />

      <CurriculumFormSheet
        visible={curriculumSheet.visible}
        item={curriculumSheet.item ?? null}
        academicLevels={orderedLevels}
        tracks={orderedTracks}
        isSubmitting={isSubmitting}
        onClose={() => setCurriculumSheet({ visible: false, mode: "create" })}
        onSubmit={handleCurriculumSubmit}
      />

      <CurriculumSubjectFormSheet
        visible={curriculumSubjectSheet.visible}
        item={curriculumSubjectSheet.item ?? null}
        selectedCurriculumId={
          curriculumSubjectSheet.item && selectedCurriculumId
            ? selectedCurriculumId
            : selectedCurriculumId || orderedCurriculums[0]?.id || ""
        }
        curriculums={orderedCurriculums}
        subjects={subjects}
        isSubmitting={isSubmitting}
        onClose={() =>
          setCurriculumSubjectSheet({ visible: false, mode: "create" })
        }
        onSubmit={handleCurriculumSubjectSubmit}
      />

      <ConfirmDialog
        visible={deleteTarget != null}
        title="Confirmer la suppression"
        subtitle={deleteTarget?.label ?? undefined}
        message={
          deleteTarget?.kind === "curriculum-subject"
            ? "La matière sera retirée du curriculum sélectionné."
            : "Cette action supprimera définitivement cet élément."
        }
        variant="danger"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  stateWrap: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  listStack: {
    gap: 12,
  },
  entityRow: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: 0,
    padding: 14,
    paddingLeft: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#8C5A24",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  entityTextWrap: {
    flex: 1,
    gap: 3,
  },
  entityTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  entityMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  iconActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 0,
    backgroundColor: "rgba(255, 253, 252, 0.84)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonNeutral: {
    backgroundColor: "#E8F5F2",
  },
  iconButtonDanger: {
    backgroundColor: "#FDEEE5",
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  subjectSelectorBar: {
    marginTop: -4,
  },
  compactSelectTrigger: {
    borderRadius: 14,
    backgroundColor: "#F9F3EA",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#7E5A2F",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  compactSelectTriggerError: {
    borderWidth: 1,
    borderColor: colors.notification,
  },
  compactSelectTriggerDisabled: {
    opacity: 0.6,
  },
  compactSelectTextWrap: {
    flex: 1,
    gap: 3,
  },
  compactSelectValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  compactSelectMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  selectOverlay: {
    flex: 1,
    backgroundColor: "rgba(18, 28, 38, 0.28)",
    justifyContent: "flex-end",
  },
  selectSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: "70%",
  },
  selectSheetTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  selectSheetOptions: {
    gap: 8,
  },
  selectOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#FBF6EF",
  },
  selectOptionRowActive: {
    backgroundColor: "#FFF0E1",
  },
  selectOptionTextWrap: {
    flex: 1,
    gap: 3,
  },
  selectOptionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  selectOptionLabelActive: {
    color: colors.textPrimary,
  },
  selectOptionMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  selectOptionMetaActive: {
    color: colors.warmAccent,
  },
  helpStack: {
    gap: 12,
  },
  helpCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 8,
  },
  helpCardTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  helpCardBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(18, 28, 38, 0.45)",
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheetKeyboard: {
    // Auto-dimensionné au contenu : pas de flex ni maxHeight ici.
    // Le ScrollView à l'intérieur est borné par maxHeight dynamique.
  },
  sheetCard: {
    // Pas de flex:1 — hauteur déterminée par le contenu (header + scroll + footer).
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
  sheetCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  sheetScrollArea: {
    // maxHeight posé inline dans ModalFrame via useWindowDimensions.
  },
  sheetBody: {
    padding: 18,
    paddingBottom: 12,
    gap: 16,
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
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  formInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
  },
  formInputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  formInputError: {
    borderColor: colors.warmAccent,
  },
  formError: {
    color: colors.warmAccent,
    fontSize: 12,
    lineHeight: 17,
  },
  switchField: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: "#FBF6EF",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  switchFieldText: {
    flex: 1,
    gap: 3,
  },
  switchFieldHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    padding: 14,
    gap: 4,
  },
  previewLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  previewValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  formActions: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: "rgba(255,255,255,0.86)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  primaryAction: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  primaryActionDisabled: {
    opacity: 0.55,
  },
  primaryActionLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
