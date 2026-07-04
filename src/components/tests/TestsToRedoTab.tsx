import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type { TestCaseToRedo } from "../../types/tests.types";

type Props = {
  items: TestCaseToRedo[];
};

export function TestsToRedoTab({ items }: Props) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  function openCase(item: TestCaseToRedo) {
    router.push({
      pathname: "/(home)/tests/cases/[testCaseId]",
      params: {
        testCaseId: item.id,
        evidenceRequired: item.evidenceRequired ? "1" : "0",
      },
    });
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty} testID="tests-to-redo-empty">
        <Text style={styles.emptyTitle}>{t("tests.toRedo.emptyTitle")}</Text>
        <Text style={styles.emptyBody}>{t("tests.toRedo.emptyMessage")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.list} testID="tests-to-redo-tab">
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() => openCase(item)}
          testID={`tests-to-redo-card-${item.id}`}
        >
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>
            {t("tests.toRedo.cardCampaign").replace(
              "{title}",
              item.campaign.title,
            )}
          </Text>
          <Text style={styles.cardMeta}>
            {t("tests.toRedo.requestedOn").replace(
              "{date}",
              formatDateTime(item.reworkRequestedAt, locale),
            )}
          </Text>
          {item.reworkNote ? (
            <Text style={styles.cardNote} numberOfLines={3}>
              {item.reworkNote}
            </Text>
          ) : null}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function formatDateTime(value: string, locale: "fr" | "en") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  empty: { paddingVertical: 40, alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  emptyBody: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  list: { gap: 12 },
  card: {
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#F0C9C2",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  cardMeta: { fontSize: 12, color: colors.textSecondary },
  cardNote: { fontSize: 13, color: colors.textPrimary, marginTop: 2 },
});
