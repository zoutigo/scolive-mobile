import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { OnboardingTarget } from "../onboarding/OnboardingTarget";
import { OnboardingScrollView } from "../onboarding/OnboardingScrollView";
import { useOnboardingTourTrigger } from "../../hooks/useOnboardingTourTrigger";
import { useOnboardingTourStore } from "../../store/onboarding-tour.store";
import { ConfirmDialog } from "../ConfirmDialog";
import { PageHelpModal } from "../help/PageHelpModal";
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
  ContactSubmission,
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

type Tab = "contact" | "legal" | "messages";

function buildContactSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email(t("siteContentAdmin.contact.error.email")),
    phone: z.string().min(1, t("siteContentAdmin.contact.error.phone")),
    addressStreet: z
      .string()
      .min(1, t("siteContentAdmin.contact.error.addressStreet")),
    addressDistrict: z.string(),
    addressCity: z
      .string()
      .min(1, t("siteContentAdmin.contact.error.addressCity")),
    addressCountry: z
      .string()
      .min(1, t("siteContentAdmin.contact.error.addressCountry")),
    legalRepresentativeFirstName: z.string(),
    legalRepresentativeLastName: z.string(),
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
  const [helpVisible, setHelpVisible] = useState(false);

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
  const advanceOnboardingTourTarget = useOnboardingTourStore(
    (state) => state.advanceIfTarget,
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
        helpAction={{
          label: t("siteContentAdmin.help.toggle"),
          onPress: () => {
            setHelpVisible(true);
            advanceOnboardingTourTarget(SITE_CONTENT_TOUR_TARGETS.helpToggle);
          },
          testID: "site-content-admin-help-menu-item",
        }}
        menuTourTargetId={SITE_CONTENT_TOUR_TARGETS.helpToggle}
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
                {
                  key: "messages",
                  label: t("siteContentAdmin.tabs.messages"),
                },
              ]}
              activeKey={tab}
              onSelect={(key) => {
                setTab(key);
                advanceOnboardingTourTarget(SITE_CONTENT_TOUR_TARGETS.tabs);
              }}
              testIDPrefix="site-content-admin-tab"
            />
          </OnboardingTarget>

          {tab === "contact" ? (
            <ContactTab t={t} />
          ) : tab === "legal" ? (
            <LegalDocumentsTab t={t} locale={locale} />
          ) : (
            <MessagesTab t={t} />
          )}
        </>
      )}

      <PageHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={t(`siteContentAdmin.help.${tab}.title`)}
        sections={(tab === "legal"
          ? [1, 2, 3]
          : tab === "contact"
            ? [1, 2]
            : [1]
        ).map((n) => ({
          title: t(`siteContentAdmin.help.${tab}.section${n}Title`),
          body: [t(`siteContentAdmin.help.${tab}.section${n}Body`)],
        }))}
        closeLabel={t("siteContentAdmin.help.close")}
        testID="site-content-admin-help"
      />
    </View>
  );
}

const EMPTY_CONTACT_FORM: ContactFormValues = {
  email: "",
  phone: "",
  addressStreet: "",
  addressDistrict: "",
  addressCity: "",
  addressCountry: "",
  legalRepresentativeFirstName: "",
  legalRepresentativeLastName: "",
};

function ContactTab({ t }: { t: (key: string) => string }) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [contact, setContact] = useState<ContactFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { showSuccess, showError } = useSuccessToastStore();

  const schema = useMemo(() => buildContactSchema(t), [t]);
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: EMPTY_CONTACT_FORM,
  });

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const info = await siteContentApi.getAdminContactInfo();
      setContact(info);
      form.reset(info);
    } catch {
      setLoadError(t("siteContentAdmin.contact.loadError"));
    } finally {
      setLoading(false);
    }
  }

  function startEdit() {
    if (contact) {
      form.reset(contact);
    }
    setMode("edit");
  }

  function cancelEdit() {
    if (contact) {
      form.reset(contact);
    }
    setMode("view");
  }

  async function onValid(values: ContactFormValues) {
    setSaving(true);
    try {
      const updated = await siteContentApi.updateContactInfo(values);
      setContact(updated);
      form.reset(updated);
      setMode("view");
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

  if (mode === "view" && contact) {
    const legalRepresentativeName = [
      contact.legalRepresentativeFirstName,
      contact.legalRepresentativeLastName,
    ]
      .filter(Boolean)
      .join(" ");
    const addressLine = [
      contact.addressStreet,
      contact.addressDistrict,
      contact.addressCity,
      contact.addressCountry,
    ]
      .filter(Boolean)
      .join(", ");

    return (
      <ScrollView
        contentContainerStyle={styles.formScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.viewCard} testID="site-content-contact-view">
          <ViewRow
            label={t("siteContentAdmin.contact.emailLabel")}
            value={contact.email}
          />
          <ViewRow
            label={t("siteContentAdmin.contact.phoneLabel")}
            value={contact.phone}
          />
          <ViewRow
            label={t("siteContentAdmin.contact.addressGroupLabel")}
            value={addressLine || t("siteContentAdmin.contact.notProvided")}
          />
          <ViewRow
            label={t(
              "siteContentAdmin.contact.legalRepresentativeFirstNameLabel",
            )}
            value={
              legalRepresentativeName ||
              t("siteContentAdmin.contact.notProvided")
            }
          />
        </View>

        <OnboardingTarget id={SITE_CONTENT_TOUR_TARGETS.contactEdit}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={startEdit}
            testID="site-content-contact-edit"
          >
            <Text style={styles.primaryBtnLabel}>
              {t("siteContentAdmin.contact.edit")}
            </Text>
          </TouchableOpacity>
        </OnboardingTarget>
      </ScrollView>
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
          label={t("siteContentAdmin.contact.addressStreetLabel")}
          control={form.control}
          name="addressStreet"
          testID="site-content-contact-address-street"
        />
        <Field
          label={t("siteContentAdmin.contact.addressDistrictLabel")}
          control={form.control}
          name="addressDistrict"
          testID="site-content-contact-address-district"
        />
        <Field
          label={t("siteContentAdmin.contact.addressCityLabel")}
          control={form.control}
          name="addressCity"
          testID="site-content-contact-address-city"
        />
        <Field
          label={t("siteContentAdmin.contact.addressCountryLabel")}
          control={form.control}
          name="addressCountry"
          testID="site-content-contact-address-country"
        />
        <Field
          label={t(
            "siteContentAdmin.contact.legalRepresentativeFirstNameLabel",
          )}
          control={form.control}
          name="legalRepresentativeFirstName"
          testID="site-content-contact-legal-rep-first-name"
        />
        <Field
          label={t("siteContentAdmin.contact.legalRepresentativeLastNameLabel")}
          control={form.control}
          name="legalRepresentativeLastName"
          testID="site-content-contact-legal-rep-last-name"
        />

        <View style={styles.draftActions}>
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
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={cancelEdit}
            testID="site-content-contact-cancel"
          >
            <Text style={styles.secondaryBtnLabel}>
              {t("siteContentAdmin.contact.cancel")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ViewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.viewRow}>
      <Text style={styles.viewRowLabel}>{label}</Text>
      <Text style={styles.viewRowValue}>{value}</Text>
    </View>
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
  name:
    | "email"
    | "phone"
    | "addressStreet"
    | "addressDistrict"
    | "addressCity"
    | "addressCountry"
    | "legalRepresentativeFirstName"
    | "legalRepresentativeLastName";
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
      <OnboardingScrollView
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
      </OnboardingScrollView>

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

const MESSAGES_PAGE_SIZE = 20;

function formatSubmissionDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MessagesTab({ t }: { t: (key: string) => string }) {
  const [items, setItems] = useState<ContactSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContactSubmission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { showError } = useSuccessToastStore();

  useEffect(() => {
    void load();
  }, [page]);

  async function load() {
    setLoading(true);
    setListError(null);
    try {
      const result = await siteContentApi.listContactSubmissions({
        page,
        limit: MESSAGES_PAGE_SIZE,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setListError(t("siteContentAdmin.messages.listError"));
    } finally {
      setLoading(false);
    }
  }

  async function openSubmission(item: ContactSubmission) {
    setSelected(item);
    setDetailLoading(true);
    try {
      const detail = await siteContentApi.getContactSubmission(item.id);
      setSelected(detail);
      if (!item.readAt) {
        setItems((prev) =>
          prev.map((current) => (current.id === detail.id ? detail : current)),
        );
      }
    } catch (error) {
      showError({
        title: t("siteContentAdmin.messages.listError"),
        message: extractApiError(error),
      });
    } finally {
      setDetailLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / MESSAGES_PAGE_SIZE));

  if (loading) {
    return (
      <View style={styles.center} testID="site-content-messages-loading">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (listError) {
    return (
      <View style={styles.center}>
        <Text style={styles.restricted}>{listError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.formsKeyboardArea}>
      {items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.restricted}>
            {t("siteContentAdmin.messages.emptyTitle")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.formScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => {
            const unread = !item.readAt;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.messageCard, unread && styles.messageCardUnread]}
                onPress={() => void openSubmission(item)}
                testID={`site-content-message-${item.id}`}
              >
                <View style={styles.messageCardHeader}>
                  <View style={styles.messageCardName}>
                    {unread ? <View style={styles.unreadDot} /> : null}
                    <Text style={styles.messageCardNameText}>{item.name}</Text>
                  </View>
                  <Text style={styles.messageCardDate}>
                    {formatSubmissionDate(item.createdAt)}
                  </Text>
                </View>
                <Text style={styles.messageCardSubject} numberOfLines={1}>
                  {item.subject}
                </Text>
                <Text style={styles.messageCardPreview} numberOfLines={2}>
                  {item.message}
                </Text>
              </TouchableOpacity>
            );
          })}

          {totalPages > 1 ? (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.smallBtn, page <= 1 && styles.smallBtnDisabled]}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                testID="site-content-messages-prev"
              >
                <Text style={styles.smallBtnLabel}>
                  {t("siteContentAdmin.messages.previous")}
                </Text>
              </TouchableOpacity>
              <Text style={styles.paginationLabel}>
                {page} / {totalPages}
              </Text>
              <TouchableOpacity
                style={[
                  styles.smallBtn,
                  page >= totalPages && styles.smallBtnDisabled,
                ]}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                testID="site-content-messages-next"
              >
                <Text style={styles.smallBtnLabel}>
                  {t("siteContentAdmin.messages.next")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      )}

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelected(null)}
        testID="site-content-message-detail-modal"
      >
        <TouchableWithoutFeedback onPress={() => setSelected(null)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.detailWrapper} pointerEvents="box-none">
          <View style={styles.detailCard} testID="site-content-message-detail">
            {selected ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>{selected.subject}</Text>
                  <TouchableOpacity
                    onPress={() => setSelected(null)}
                    testID="site-content-message-detail-close"
                  >
                    <Ionicons
                      name="close"
                      size={22}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.detailDate}>
                  {formatSubmissionDate(selected.createdAt)}
                </Text>

                <View style={styles.detailContactBox}>
                  <View style={styles.detailContactRow}>
                    <Ionicons
                      name="person-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.detailContactText}>
                      {selected.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.detailContactRow}
                    onPress={() =>
                      void Linking.openURL(`mailto:${selected.email}`)
                    }
                    testID="site-content-message-detail-email"
                  >
                    <Ionicons
                      name="mail-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={[styles.detailContactText, styles.detailLink]}>
                      {selected.email}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.detailContactRow}>
                    <Ionicons
                      name="call-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.detailContactText}>
                      {selected.phone}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detailMessage}>{selected.message}</Text>

                {detailLoading ? (
                  <Text style={styles.detailReadLabel}>
                    {t("siteContentAdmin.messages.loading")}
                  </Text>
                ) : selected.readAt ? (
                  <Text style={styles.detailReadLabel}>
                    {t("siteContentAdmin.messages.read")}
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() =>
                    void Linking.openURL(`mailto:${selected.email}`)
                  }
                  testID="site-content-message-detail-reply"
                >
                  <Text style={styles.primaryBtnLabel}>
                    {t("siteContentAdmin.messages.reply")}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
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
  viewCard: {
    gap: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
  },
  viewRow: { gap: 2 },
  viewRowLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: colors.textSecondary,
  },
  viewRowValue: { fontSize: 14, color: colors.textPrimary },
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
  messageCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 6,
    padding: 12,
    gap: 4,
  },
  messageCardUnread: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}0D`,
  },
  messageCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  messageCardName: { flexDirection: "row", alignItems: "center", gap: 6 },
  messageCardNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  messageCardDate: { fontSize: 11, color: colors.textSecondary },
  messageCardSubject: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  messageCardPreview: { fontSize: 12, color: colors.textSecondary },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  smallBtnDisabled: { opacity: 0.5 },
  paginationLabel: { fontSize: 13, color: colors.textSecondary },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  detailWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  detailCard: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  detailTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  detailDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  detailContactBox: {
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 6,
    padding: 12,
  },
  detailContactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailContactText: { fontSize: 13, color: colors.textPrimary },
  detailLink: { color: colors.primary, fontWeight: "600" },
  detailMessage: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  detailReadLabel: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
