/**
 * Formulaire de saisie / modification d'un événement de vie scolaire.
 * Utilisé par les vues teacher et school_admin / manager / supervisor.
 */
import React, { useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import {
  buildLifeEventPayload,
  disciplineFormSchema,
  DISCIPLINE_TYPE_CONFIG,
  typeHasJustified,
  type DisciplineFormInput,
  type CreateLifeEventPayload,
  type StudentLifeEvent,
  type StudentLifeEventType,
} from "../../types/discipline.types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  /** Événement à éditer (null = mode création). */
  editing?: StudentLifeEvent | null;
  isSaving?: boolean;
  error?: string | null;
  onSubmit: (values: CreateLifeEventPayload) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nowLocalIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function eventToFormValues(event: StudentLifeEvent): DisciplineFormInput {
  const d = new Date(event.occurredAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const occurredAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return {
    type: event.type,
    occurredAt,
    reason: event.reason,
    durationMinutes:
      event.durationMinutes != null ? String(event.durationMinutes) : "",
    justified: event.justified ?? false,
    comment: event.comment ?? "",
  };
}

function defaultValues(): DisciplineFormInput {
  return {
    type: "ABSENCE",
    occurredAt: nowLocalIso(),
    reason: "",
    durationMinutes: "",
    justified: false,
    comment: "",
  };
}

const TYPES: StudentLifeEventType[] = [
  "ABSENCE",
  "RETARD",
  "SANCTION",
  "PUNITION",
];

// ── Composant ─────────────────────────────────────────────────────────────────

export function DisciplineForm({
  editing,
  isSaving = false,
  error,
  onSubmit,
  onCancel,
  submitLabel,
}: Props) {
  const [values, setValues] = React.useState<DisciplineFormInput>(
    editing ? eventToFormValues(editing) : defaultValues(),
  );
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof DisciplineFormInput, string>>
  >({});

  // Resync si l'événement édité change (ex. ouverture d'un autre événement)
  useEffect(() => {
    setValues(editing ? eventToFormValues(editing) : defaultValues());
    setErrors({});
  }, [editing?.id]);

  function set<K extends keyof DisciplineFormInput>(
    key: K,
    value: DisciplineFormInput[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const result = disciplineFormSchema.safeParse(values);

    if (result.success) {
      setErrors({});
      return true;
    }

    const newErrors: Partial<Record<keyof DisciplineFormInput, string>> = {};
    result.error.issues.forEach((issue) => {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in newErrors)) {
        newErrors[key as keyof DisciplineFormInput] = issue.message;
      }
    });
    setErrors(newErrors);
    return false;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit(buildLifeEventPayload(values));
  }

  const showJustified = typeHasJustified(values.type);
  const isEditing = Boolean(editing);
  const label =
    submitLabel ??
    (isEditing ? "Enregistrer les modifications" : "Enregistrer l'événement");

  return (
    <View style={styles.root} testID="discipline-form">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type d'événement */}
        <View style={styles.field}>
          <Text style={styles.label}>Type d'événement *</Text>
          <View style={styles.typeRow}>
            {TYPES.map((t) => {
              const cfg = DISCIPLINE_TYPE_CONFIG[t];
              const active = values.type === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    active && {
                      backgroundColor: cfg.bg,
                      borderColor: cfg.accent,
                    },
                  ]}
                  onPress={() => {
                    set("type", t);
                    // Effacer "justified" si le type ne le supporte pas
                    if (!typeHasJustified(t)) set("justified", false);
                  }}
                  activeOpacity={0.75}
                  testID={`type-chip-${t}`}
                  accessibilityLabel={cfg.label}
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons
                    name={cfg.icon as "time-outline"}
                    size={14}
                    color={active ? cfg.accent : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeChipLabel,
                      active && { color: cfg.accent, fontWeight: "700" },
                    ]}
                  >
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Date et heure */}
        <View style={styles.field}>
          <Text style={styles.label}>Date et heure *</Text>
          <TextInput
            style={[styles.input, errors.occurredAt && styles.inputError]}
            value={values.occurredAt}
            onChangeText={(v) => set("occurredAt", v)}
            placeholder="YYYY-MM-DDTHH:mm"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            selectTextOnFocus={isEditing}
            testID="input-occurred-at"
          />
          {errors.occurredAt && (
            <Text style={styles.fieldError}>{errors.occurredAt}</Text>
          )}
        </View>

        {/* Motif */}
        <View style={styles.field}>
          <Text style={styles.label}>Motif *</Text>
          <TextInput
            style={[styles.input, errors.reason && styles.inputError]}
            value={values.reason}
            onChangeText={(v) => set("reason", v)}
            placeholder="Ex : travail non rendu, absence non justifiée…"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            selectTextOnFocus={isEditing}
            testID="input-reason"
          />
          {errors.reason && (
            <Text style={styles.fieldError}>{errors.reason}</Text>
          )}
        </View>

        {/* Durée */}
        <View style={styles.field}>
          <Text style={styles.label}>Durée (minutes, optionnel)</Text>
          <TextInput
            style={[styles.input, errors.durationMinutes && styles.inputError]}
            value={values.durationMinutes}
            onChangeText={(v) => set("durationMinutes", v)}
            placeholder="Ex : 15"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            selectTextOnFocus={isEditing}
            testID="input-duration"
          />
          {errors.durationMinutes && (
            <Text style={styles.fieldError}>{errors.durationMinutes}</Text>
          )}
        </View>

        {/* Justifié (uniquement ABSENCE / RETARD) */}
        {showJustified && (
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.label}>Justifié</Text>
              <Text style={styles.switchSub}>
                Absence ou retard justifié par les parents / administration
              </Text>
            </View>
            <Switch
              value={values.justified}
              onValueChange={(v) => set("justified", v)}
              thumbColor={
                values.justified ? colors.accentTeal : colors.warmBorder
              }
              trackColor={{
                false: colors.border,
                true: colors.accentTeal + "66",
              }}
              testID="switch-justified"
            />
          </View>
        )}

        {/* Commentaire */}
        <View style={styles.field}>
          <Text style={styles.label}>Commentaire (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={values.comment}
            onChangeText={(v) => set("comment", v)}
            placeholder="Observations supplémentaires…"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            selectTextOnFocus={isEditing}
            testID="input-comment"
          />
        </View>

        {/* Erreur globale */}
        {error && (
          <View style={styles.errorBox} testID="form-error">
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={colors.notification}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.btnRow}>
          {onCancel && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={isSaving}
              testID="btn-cancel"
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.submitBtn, isSaving && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSaving}
            testID="btn-submit"
            accessibilityLabel={label}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>{label}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 20 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },

  field: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
  },
  typeChipLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.notification,
  },
  textarea: {
    minHeight: 80,
    paddingTop: 12,
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 14,
  },
  switchInfo: { flex: 1, gap: 2, paddingRight: 12 },
  switchSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },

  fieldError: {
    fontSize: 12,
    color: colors.notification,
    marginTop: 2,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFF5F5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.notification,
    lineHeight: 18,
  },

  btnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
});
