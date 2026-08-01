import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { siteContentApi } from "../../api/site-content.api";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { AppShell } from "../navigation/AppShell";
import { moduleBack } from "../../utils/moduleBack";
import { useTranslation } from "../../i18n/useTranslation";
import { colors } from "../../theme";
import type {
  LegalDocumentSlug,
  PublicLegalDocument,
} from "../../types/site-content.types";
import { ErrorBanner, LoadingBlock } from "../timetable/TimetableCommon";
import { RichContentView } from "../editor/RichContentView";

export function LegalDocumentScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [doc, setDoc] = useState<PublicLegalDocument | null>(null);
  const [publisherName, setPublisherName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [slug, locale]);

  async function load() {
    if (!slug) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [result, contact] = await Promise.all([
        siteContentApi.getLegalDocument(
          slug as LegalDocumentSlug,
          locale === "en" ? "en" : "fr",
        ),
        slug === "mentions-legales"
          ? siteContentApi.getContactInfo()
          : Promise.resolve(null),
      ]);
      setDoc(result);
      const name = contact
        ? [
            contact.legalRepresentativeFirstName,
            contact.legalRepresentativeLastName,
          ]
            .filter(Boolean)
            .join(" ")
        : "";
      setPublisherName(name || null);
    } catch {
      setError(t("legalScreen.errors.load"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell showHeader={false}>
      <ModuleHeader
        title={doc?.title ?? t("legalScreen.title")}
        onBack={() => moduleBack(router)}
        testID="legal-document-header"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        testID="legal-document-scroll"
      >
        {loading ? (
          <LoadingBlock label={t("legalScreen.loading")} />
        ) : error ? (
          <ErrorBanner message={error} testID="legal-document-error" />
        ) : doc ? (
          <>
            <RichContentView
              html={doc.contentHtml}
              testID="legal-document-body"
            />
            {publisherName ? (
              <Text
                style={styles.publisherName}
                testID="legal-document-publisher-name"
              >
                {t("legalScreen.publisherLabel")} {publisherName}
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  publisherName: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
