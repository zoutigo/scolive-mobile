import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useTicketsStore } from "../../store/tickets.store";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { ModuleHeader } from "../navigation/ModuleHeader";
import type { TicketType } from "../../types/tickets.types";

const schema = z.object({
  type: z.enum(["BUG", "FEATURE_REQUEST"]),
  title: z
    .string()
    .min(5, "Le titre doit contenir au moins 5 caractères")
    .max(120, "Le titre est trop long"),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères")
    .max(4000, "La description est trop longue"),
});

type FormValues = z.infer<typeof schema>;

const TYPE_OPTIONS: Array<{
  value: TicketType;
  label: string;
  icon: string;
  desc: string;
}> = [
  {
    value: "BUG",
    label: "Signaler un bug",
    icon: "bug-outline",
    desc: "Quelque chose ne fonctionne pas correctement",
  },
  {
    value: "FEATURE_REQUEST",
    label: "Suggérer une amélioration",
    icon: "bulb-outline",
    desc: "Une idée pour rendre l'application meilleure",
  },
];

interface AttachmentFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

export function CreateTicketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { schoolSlug } = useAuthStore();
  const { createTicket } = useTicketsStore();
  const { show } = useSuccessToastStore();

  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const androidStatusInset =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "BUG",
      title: "",
      description: "",
    },
  });

  const selectedType = watch("type");

  const pickImage = async () => {
    if (attachments.length >= 5) {
      Alert.alert("Limite atteinte", "Maximum 5 pièces jointes.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAttachments((prev) => [
        ...prev,
        {
          uri: asset.uri,
          name: asset.fileName ?? `image_${Date.now()}.jpg`,
          mimeType: asset.mimeType ?? "image/jpeg",
          size: asset.fileSize,
        },
      ]);
    }
  };

  const pickDocument = async () => {
    if (attachments.length >= 5) {
      Alert.alert("Limite atteinte", "Maximum 5 pièces jointes.");
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAttachments((prev) => [
        ...prev,
        {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? "application/octet-stream",
          size: asset.size,
        },
      ]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await createTicket({
        type: values.type,
        title: values.title,
        description: values.description,
        schoolSlug: schoolSlug ?? undefined,
        platform: "mobile",
        appVersion: undefined,
        attachments,
      });
      show({
        title: "Ticket envoyé",
        message: "Nous avons bien reçu votre signalement.",
      });
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue.";
      show({ variant: "error", title: "Erreur", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[styles.container, { paddingBottom: insets.bottom }]}
        testID="create-ticket-screen"
      >
        <ModuleHeader
          title="Nouveau ticket"
          subtitle="Bug ou suggestion"
          onBack={() => router.back()}
          topInset={androidStatusInset}
          testID="create-ticket-header"
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Sélection du type */}
          <Text style={styles.sectionLabel}>Type de signalement</Text>
          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <View style={styles.typeRow}>
                {TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.typeCard,
                      value === opt.value && styles.typeCardActive,
                    ]}
                    onPress={() => onChange(opt.value)}
                    testID={`ticket-type-${opt.value}`}
                  >
                    <Ionicons
                      name={opt.icon as never}
                      size={22}
                      color={
                        value === opt.value
                          ? colors.white
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.typeLabel,
                        value === opt.value && styles.typeLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={[
                        styles.typeDesc,
                        value === opt.value && styles.typeDescActive,
                      ]}
                    >
                      {opt.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          {/* Titre */}
          <Text style={styles.sectionLabel}>
            Titre <Text style={styles.required}>*</Text>
          </Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={
                  selectedType === "BUG"
                    ? "Ex : Impossible de sauvegarder une note"
                    : "Ex : Ajouter un mode sombre"
                }
                placeholderTextColor={colors.textSecondary}
                maxLength={120}
                testID="ticket-title-input"
              />
            )}
          />
          {errors.title && (
            <Text style={styles.errorText} testID="ticket-title-error">
              {errors.title.message}
            </Text>
          )}

          {/* Description */}
          <Text style={styles.sectionLabel}>
            Description <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.hint}>
            {selectedType === "BUG"
              ? "Décrivez les étapes pour reproduire le bug, ce que vous attendiez et ce qui s'est passé."
              : "Décrivez votre suggestion et en quoi elle améliorerait votre usage quotidien."}
          </Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.textarea,
                  errors.description && styles.inputError,
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Votre description…"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={4000}
                testID="ticket-description-input"
              />
            )}
          />
          {errors.description && (
            <Text style={styles.errorText} testID="ticket-description-error">
              {errors.description.message}
            </Text>
          )}

          {/* Pièces jointes */}
          <Text style={styles.sectionLabel}>
            Pièces jointes{" "}
            <Text style={styles.optional}>(optionnel, max 5)</Text>
          </Text>

          <View style={styles.attachmentActions}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={pickImage}
              testID="pick-image-btn"
            >
              <Ionicons name="image-outline" size={16} color={colors.primary} />
              <Text style={styles.attachBtnText}>Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={pickDocument}
              testID="pick-document-btn"
            >
              <Ionicons
                name="document-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.attachBtnText}>Fichier</Text>
            </TouchableOpacity>
          </View>

          {attachments.map((file, idx) => (
            <View
              key={`${file.uri}-${idx}`}
              style={styles.attachRow}
              testID={`attachment-${idx}`}
            >
              <Ionicons
                name="attach-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.attachName} numberOfLines={1}>
                {file.name}
              </Text>
              <TouchableOpacity
                onPress={() => removeAttachment(idx)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                testID={`remove-attachment-${idx}`}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          ))}

          {/* Bouton soumettre */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            testID="create-ticket-submit"
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color={colors.white} />
                <Text style={styles.submitLabel}>Envoyer le ticket</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 6,
  },
  required: { color: colors.notification },
  optional: { fontWeight: "400", color: colors.textSecondary },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 17,
  },

  typeRow: { flexDirection: "row", gap: 10 },
  typeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
    alignItems: "flex-start",
  },
  typeCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  typeLabelActive: { color: colors.white },
  typeDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 14,
  },
  typeDescActive: { color: "rgba(255,255,255,0.75)" },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  textarea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 110,
  },
  inputError: { borderColor: colors.notification },
  errorText: {
    fontSize: 11,
    color: colors.notification,
    marginTop: 3,
  },

  attachmentActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  attachBtnText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
  },
  attachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 6,
  },
  attachName: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },

  submitBtn: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
});
