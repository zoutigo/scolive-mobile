import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { siteContentApi } from "../../api/site-content.api";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { AppShell } from "../navigation/AppShell";
import { moduleBack } from "../../utils/moduleBack";
import { useTranslation } from "../../i18n/useTranslation";
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
      const result = await siteContentApi.getLegalDocument(
        slug as LegalDocumentSlug,
        locale === "en" ? "en" : "fr",
      );
      setDoc(result);
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
          <RichContentView html={doc.contentHtml} testID="legal-document-body" />
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
});
