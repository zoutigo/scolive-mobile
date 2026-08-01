import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { OnboardingTarget } from "../onboarding/OnboardingTarget";
import { useOnboardingTourTrigger } from "../../hooks/useOnboardingTourTrigger";
import { useOnboardingTourStore } from "../../store/onboarding-tour.store";
import { ConfirmDialog } from "../ConfirmDialog";
import {
  RichEditorField,
  type RichEditorFieldRef,
} from "../editor/RichEditorField";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { extractApiError } from "../../utils/api-error";
import { moduleBack } from "../../utils/moduleBack";
import { siteContentApi } from "../../api/site-content.api";
import type {
  LegalDocumentItem,
  LegalDocumentSlug,
  SiteContentLocale,
} from "../../types/site-content.types";
import {
  SITE_CONTENT_TOUR_ID,
  SITE_CONTENT_TOUR_STEPS,
  SITE_CONTENT_TOUR_TARGETS,
} from "./site-content-tour.config";

function roleAllowsPlatformAdmin(role: string | null | undefined) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

const LEGAL_SLUGS: LegalDocumentSlug[] = [
  "cgu",
  "mentions-legales",
  "confidentialite",
];
const LEGAL_LOCALES: SiteContentLocale[] = ["fr", "en"];

type Tab = "contact" | "legal";

function buildContactSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email(t("siteContentAdmin.contact.error.email")),
    phone: z.string().min(1, t("siteContentAdmin.contact.error.phone")),
    address: z.string().min(1, t("siteContentAdmin.contact.error.address")),
  });
}

type ContactFormValues = z.infer<ReturnType<typeof buildContactSchema>>;

function buildLegalDraftSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().min(1, t("siteContentAdmin.legal.error.title")),
    contentHtml: z
      .string()
      .refine(
        (value) => value.replace(/<[^>]*>/g, "").trim().length > 0,
        t("siteContentAdmin.legal.error.content"),
      ),
  });
}

type LegalDraftFormValues = z.infer<ReturnType<typeof buildLegalDraftSchema>>;

export function SiteContentAdminScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<Tab>("contact");

  const effectiveRole = user?.activeRole ?? user?.role ?? null;
  const isPlatformAdmin = roleAllowsPlatformAdmin(effectiveRole);

  useOnboardingTourTrigger({
    tourId: SITE_CONTENT_TOUR_ID,
    role: "platform",
    steps: SITE_CONTENT_TOUR_STEPS,
  });
  const onboardingActiveTargetKey = useOnboardingTourStore((state) =>
    state.activeTourId ? state.steps[state.stepIndex]?.targetKey : undefined,
  );

  // Steps 2 and 3 target controls that only exist in the "legal" tab — force
  // that tab while the tour is on one of them so the target actually mounts.
  useEffect(() => {
    if (
      (onboardingActiveTargetKey === SITE_CONTENT_TOUR_TARGETS.selectors ||
        onboardingActiveTargetKey === SITE_CONTENT_TOUR_TARGETS.newDraft) &&
      tab !== "legal"
    ) {
      setTab("legal");
    }
  }, [onboardingActiveTargetKey, tab]);

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={t("siteContentAdmin.title")}
        subtitle={t("siteContentAdmin.subtitle")}
        onBack={() => moduleBack(router)}
        topInset={insets.top}
        testID="site-content-admin-header"
      />

      {!isPlatformAdmin ? (
        <View style={styles.center}>
          <Text style={styles.restricted}>
            {t("siteContentAdmin.restricted")}
          </Text>
        </View>
      ) : (
        <>
          <OnboardingTarget id={SITE_CONTENT_TOUR_TARGETS.tabs}>
            <UnderlineTabs
              items={[
                { key: "contact", label: t("siteContentAdmin.tabs.contact") },
                { key: "legal", label: t("siteContentAdmin.tabs.legal") },
              ]}
              activeKey={tab}
              onSelect={setTab}
              testIDPrefix="site-content-admin-tab"
            />
          </OnboardingTarget>

          {tab === "contact" ? (
            <ContactTab t={t} />
          ) : (
            <LegalDocumentsTab t={t} locale={locale} />
          )}
        </>
      )}
    </View>
  );
}

function ContactTab({ t }: { t: (key: string) => string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { showSuccess, showError } = useSuccessToastStore();

  const schema = useMemo(() => buildContactSchema(t), [t]);
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: "", phone: "", address: "" },
  });

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const info = await siteContentApi.getAdminContactInfo();
      form.reset(info);
    } catch {
      setLoadError(t("siteContentAdmin.contact.loadError"));
    } finally {
      setLoading(false);
    }
  }

  async function onValid(values: ContactFormValues) {
    setSaving(true);
    try {
      const updated = await siteContentApi.updateContactInfo(values);
      form.reset(updated);
      showSuccess({
        title: t("siteContentAdmin.contact.save"),
        message: t("siteContentAdmin.contact.saveSuccess"),
      });
    } catch (error) {
      showError({
        title: t("siteContentAdmin.contact.saveError"),
        message: extractApiError(error),
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center} testID="site-content-contact-loading">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.restricted}>{loadError}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
    >
      <ScrollView
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Field
          label={t("siteContentAdmin.contact.emailLabel")}
          control={form.control}
          name="email"
          testID="site-content-contact-email"
          keyboardType="email-address"
        />
        <Field
          label={t("siteContentAdmin.contact.phoneLabel")}
          control={form.control}
          name="phone"
          testID="site-content-contact-phone"
        />
        <Field
          label={t("siteContentAdmin.contact.addressLabel")}
          control={form.control}
          name="address"
          testID="site-content-contact-address"
        />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={form.handleSubmit(onValid)}
          disabled={saving}
          testID="site-content-contact-submit"
        >
          <Text style={styles.primaryBtnLabel}>
            {t("siteContentAdmin.contact.save")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  control,
  name,
  testID,
  keyboardType,
}: {
  label: string;
  control: any;
  name: "email" | "phone" | "address";
  testID: string;
  keyboardType?: "email-address";
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value }, fieldState }) => (
          <>
            <TextInput
              style={[styles.input, fieldState.error && styles.inputError]}
              value={value}
              onChangeText={onChange}
              keyboardType={keyboardType}
              autoCapitalize="none"
              placeholderTextColor={colors.textSecondary}
              testID={testID}
            />
            {fieldState.error ? (
              <Text style={styles.fieldError}>{fieldState.error.message}</Text>
            ) : null}
          </>
        )}
      />
    </View>
  );
}

function LegalDocumentsTab({
  t,
  locale,
}: {
  t: (key: string) => string;
  locale: string;
}) {
  const editorRef = useRef<RichEditorFieldRef>(null);
  const { showSuccess, showError } = useSuccessToastStore();
  const [slug, setSlug] = useState<LegalDocumentSlug>("cgu");
  const [docLocale, setDocLocale] = useState<SiteContentLocale>(
    locale === "en" ? "en" : "fr",
  );
  const [items, setItems] = useState<LegalDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "publish" | "delete";
    id: string;
  } | null>(null);

  const schema = useMemo(() => buildLegalDraftSchema(t), [t]);
  const form = useForm<LegalDraftFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { title: "", contentHtml: "" },
  });

  useEffect(() => {
    void load();
    setEditingId(null);
    form.reset({ title: "", contentHtml: "" });
    editorRef.current?.clear();
  }, [slug, docLocale]);

  async function load() {
    setLoading(true);
    setListError(null);
    try {
      const list = await siteContentApi.listLegalDocuments({
        slug,
        locale: docLocale,
      });
      setItems(list);
    } catch {
      setListError(t("siteContentAdmin.legal.listError"));
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: LegalDocumentItem) {
    setEditingId(item.id);
    form.reset({ title: item.title, contentHtml: item.contentHtml });
    editorRef.current?.setContentHtml(item.contentHtml);
  }

  function startNewDraft() {
    setEditingId("new");
    form.reset({ title: "", contentHtml: "" });
    editorRef.current?.clear();
  }

  function cancelEdit() {
    setEditingId(null);
    form.reset({ title: "", contentHtml: "" });
    editorRef.current?.clear();
  }

  async function onValid(values: LegalDraftFormValues) {
    setSaving(true);
    try {
      if (editingId === "new") {
        await siteContentApi.createLegalDocument({
          slug,
          locale: docLocale,
          ...values,
        });
        showSuccess({
          title: t("siteContentAdmin.legal.newDraftTitle"),
          message: t("siteContentAdmin.legal.createSuccess"),
        });
      } else if (editingId) {
        await siteContentApi.updateLegalDocument(editingId, values);
        showSuccess({
          title: t("siteContentAdmin.legal.saveDraft"),
          message: t("siteContentAdmin.legal.saveDraftSuccess"),
        });
      }
      setEditingId(null);
      form.reset({ title: "", contentHtml: "" });
      editorRef.current?.clear();
      await load();
    } catch (error) {
      showError({
        title:
          editingId === "new"
            ? t("siteContentAdmin.legal.createError")
            : t("siteContentAdmin.legal.saveDraftError"),
        message: extractApiError(error),
      });
    } finally {
      setSaving(false);
    }
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;
    try {
      if (pendingAction.type === "publish") {
        await siteContentApi.publishLegalDocument(pendingAction.id);
        showSuccess({
          title: t("siteContentAdmin.legal.publish"),
          message: t("siteContentAdmin.legal.publishSuccess"),
        });
      } else {
        await siteContentApi.deleteLegalDocument(pendingAction.id);
        showSuccess({
          title: t("siteContentAdmin.legal.delete"),
          message: t("siteContentAdmin.legal.deleteSuccess"),
        });
      }
      await load();
    } catch (error) {
      showError({
        title:
          pendingAction.type === "publish"
            ? t("siteContentAdmin.legal.publishError")
            : t("siteContentAdmin.legal.deleteError"),
        message: extractApiError(error),
      });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
    >
      <ScrollView
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <OnboardingTarget id={SITE_CONTENT_TOUR_TARGETS.selectors}>
          <View>
            <Text style={styles.fieldLabel}>
              {t("siteContentAdmin.legal.slugLabel")}
            </Text>
            <View style={styles.chipsWrap}>
              {LEGAL_SLUGS.map((entry) => (
                <TouchableOpacity
                  key={entry}
                  style={[styles.chip, slug === entry && styles.chipActive]}
                  onPress={() => setSlug(entry)}
                  testID={`site-content-legal-slug-${entry}`}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      slug === entry && styles.chipLabelActive,
                    ]}
                  >
                    {t(`siteContentAdmin.legal.slug.${entry}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>
              {t("siteContentAdmin.legal.localeLabel")}
            </Text>
            <View style={styles.chipsWrap}>
              {LEGAL_LOCALES.map((entry) => (
                <TouchableOpacity
                  key={entry}
                  style={[
                    styles.chip,
                    docLocale === entry && styles.chipActive,
                  ]}
                  onPress={() => setDocLocale(entry)}
                  testID={`site-content-legal-locale-${entry}`}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      docLocale === entry && styles.chipLabelActive,
                    ]}
                  >
                    {t(`siteContentAdmin.legal.locale.${entry}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </OnboardingTarget>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : listError ? (
          <Text style={styles.restricted}>{listError}</Text>
        ) : (
          <View style={styles.versionsList}>
            {items.length === 0 ? (
              <Text style={styles.emptyText}>
                {t("siteContentAdmin.legal.empty")}
              </Text>
            ) : (
              items.map((item) => (
                <View key={item.id} style={styles.versionRow}>
                  <View style={styles.versionInfo}>
                    <Text style={styles.versionTitle}>{item.title}</Text>
                    <Text style={styles.versionMeta}>
                      {t("siteContentAdmin.legal.version")} {item.version} —{" "}
                      {t(`siteContentAdmin.legal.status.${item.status}`)}
                    </Text>
                  </View>
                  {item.status === "DRAFT" ? (
                    <View style={styles.versionActions}>
                      <TouchableOpacity
                        style={styles.smallBtn}
                        onPress={() => startEdit(item)}
                        testID={`site-content-legal-edit-${item.id}`}
                      >
                        <Text style={styles.smallBtnLabel}>
                          {t("siteContentAdmin.legal.edit")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.smallBtn, styles.smallBtnPrimary]}
                        onPress={() =>
                          setPendingAction({ type: "publish", id: item.id })
                        }
                        testID={`site-content-legal-publish-${item.id}`}
                      >
                        <Text
                          style={[
                            styles.smallBtnLabel,
                            styles.smallBtnLabelPrimary,
                          ]}
                        >
                          {t("siteContentAdmin.legal.publish")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.smallBtn}
                        onPress={() =>
                          setPendingAction({ type: "delete", id: item.id })
                        }
                        testID={`site-content-legal-delete-${item.id}`}
                      >
                        <Text style={styles.smallBtnLabel}>
                          {t("siteContentAdmin.legal.delete")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ))
            )}

            {editingId === null ? (
              <OnboardingTarget id={SITE_CONTENT_TOUR_TARGETS.newDraft}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={startNewDraft}
                  testID="site-content-legal-new-draft"
                >
                  <Text style={styles.secondaryBtnLabel}>
                    {t("siteContentAdmin.legal.newDraftTitle")}
                  </Text>
                </TouchableOpacity>
              </OnboardingTarget>
            ) : (
              <View style={styles.draftForm}>
                <Field
                  label={t("siteContentAdmin.legal.titleLabel")}
                  control={form.control}
                  name={"title" as never}
                  testID="site-content-legal-draft-title"
                />
                <Controller
                  control={form.control}
                  name="contentHtml"
                  render={({ field: { onChange }, fieldState }) => (
                    <>
                      <RichEditorField
                        ref={editorRef}
                        placeholder={t("siteContentAdmin.legal.contentLabel")}
                        onChangeHtml={onChange}
                        colorPresets={[{ label: "Bleu", value: "#0C5FA8" }]}
                        labels={{
                          colorMenuTitle: t(
                            "siteContentAdmin.editor.colorMenuTitle",
                          ),
                          colorMenuMessage: t(
                            "siteContentAdmin.editor.colorMenuMessage",
                          ),
                          cancel: t("siteContentAdmin.editor.cancel"),
                        }}
                        minHeight={180}
                      />
                      {fieldState.error ? (
                        <Text style={styles.fieldError}>
                          {fieldState.error.message}
                        </Text>
                      ) : null}
                    </>
                  )}
                />
                <View style={styles.draftActions}>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={form.handleSubmit(onValid)}
                    disabled={saving}
                    testID="site-content-legal-draft-submit"
                  >
                    <Text style={styles.primaryBtnLabel}>
                      {editingId === "new"
                        ? t("siteContentAdmin.legal.createDraft")
                        : t("siteContentAdmin.legal.saveDraft")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={cancelEdit}
                    testID="site-content-legal-draft-cancel"
                  >
                    <Text style={styles.secondaryBtnLabel}>
                      {t("siteContentAdmin.legal.cancel")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={pendingAction !== null}
        title={
          pendingAction?.type === "publish"
            ? t("siteContentAdmin.legal.publishConfirmTitle")
            : t("siteContentAdmin.legal.deleteConfirmTitle")
        }
        message={
          pendingAction?.type === "publish"
            ? t("siteContentAdmin.legal.publishConfirm")
            : t("siteContentAdmin.legal.deleteConfirm")
        }
        confirmLabel={
          pendingAction?.type === "publish"
            ? t("siteContentAdmin.legal.publish")
            : t("siteContentAdmin.legal.delete")
        }
        cancelLabel={t("siteContentAdmin.legal.cancel")}
        variant={pendingAction?.type === "delete" ? "danger" : "warning"}
        onConfirm={() => void confirmPendingAction()}
        onCancel={() => setPendingAction(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  restricted: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
  },
  formsKeyboardArea: { flex: 1 },
  formScrollContent: { padding: 16, gap: 12, paddingBottom: 32 },
  fieldWrap: { gap: 4 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputError: { borderColor: colors.notification },
  fieldError: { fontSize: 12, color: colors.notification },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  chipLabelActive: { color: colors.white },
  primaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingVertical: 13,
  },
  primaryBtnLabel: { fontSize: 14, fontWeight: "800", color: colors.white },
  secondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
  },
  secondaryBtnLabel: { fontSize: 14, fontWeight: "700", color: colors.primary },
  versionsList: { gap: 10, marginTop: 12 },
  emptyText: { fontSize: 13, color: colors.textSecondary },
  versionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    borderRadius: 6,
    padding: 12,
    gap: 8,
  },
  versionInfo: { flex: 1, gap: 2 },
  versionTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  versionMeta: { fontSize: 12, color: colors.textSecondary },
  versionActions: { flexDirection: "row", gap: 6 },
  smallBtn: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  smallBtnPrimary: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  smallBtnLabel: { fontSize: 11, fontWeight: "700", color: colors.textPrimary },
  smallBtnLabelPrimary: { color: colors.white },
  draftForm: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
  },
  draftActions: { flexDirection: "row", gap: 10 },
});
