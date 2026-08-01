import React, { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { siteContentApi } from "../../api/site-content.api";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { AppShell } from "../navigation/AppShell";
import { moduleBack } from "../../utils/moduleBack";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type { ContactInfo, LegalDocumentSlug } from "../../types/site-content.types";
import { ErrorBanner, LoadingBlock, SectionCard } from "../timetable/TimetableCommon";

const LEGAL_DOCUMENTS: LegalDocumentSlug[] = [
  "cgu",
  "mentions-legales",
  "confidentialite",
];

export function AboutScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const info = await siteContentApi.getContactInfo();
      setContactInfo(info);
    } catch {
      setError(t("aboutScreen.errors.loadContact"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell showHeader={false}>
      <ModuleHeader
        title={t("aboutScreen.title")}
        onBack={() => moduleBack(router)}
        testID="about-screen-header"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        testID="about-screen-scroll"
      >
        <SectionCard
          title={t("aboutScreen.contactTitle")}
          testID="about-screen-contact-card"
        >
          {loading ? (
            <LoadingBlock label={t("aboutScreen.loading")} />
          ) : error ? (
            <ErrorBanner message={error} testID="about-screen-contact-error" />
          ) : contactInfo ? (
            <View style={styles.contactStack}>
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${contactInfo.email}`)}
                testID="about-screen-email"
              >
                <Ionicons name="mail-outline" size={18} color={colors.primary} />
                <Text style={styles.contactText}>{contactInfo.email}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${contactInfo.phone}`)}
                testID="about-screen-phone"
              >
                <Ionicons name="call-outline" size={18} color={colors.primary} />
                <Text style={styles.contactText}>{contactInfo.phone}</Text>
              </TouchableOpacity>

              <View style={styles.contactRow}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.contactText}>{contactInfo.address}</Text>
              </View>
            </View>
          ) : null}
        </SectionCard>

        <SectionCard
          title={t("aboutScreen.legalTitle")}
          testID="about-screen-legal-card"
        >
          <View style={styles.legalStack}>
            {LEGAL_DOCUMENTS.map((slug) => (
              <TouchableOpacity
                key={slug}
                style={styles.legalRow}
                onPress={() =>
                  router.push({
                    pathname: "/(home)/legal/[slug]",
                    params: { slug },
                  })
                }
                testID={`about-screen-legal-${slug}`}
              >
                <Text style={styles.legalText}>
                  {t(`aboutScreen.legal.${slug}`)}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>
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
    gap: 16,
  },
  contactStack: {
    gap: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contactText: {
    fontSize: 14,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  legalStack: {
    gap: 4,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legalText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
});
