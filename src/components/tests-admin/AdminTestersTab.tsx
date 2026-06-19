import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { testsAdminApi } from "../../api/tests-admin.api";
import type { AdminTesterRow } from "../../types/tests-admin.types";
import { QuickMessageSheet } from "./QuickMessageSheet";

export function AdminTestersTab() {
  const { t } = useTranslation();
  const [testers, setTesters] = useState<AdminTesterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [messageTarget, setMessageTarget] = useState<AdminTesterRow | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await testsAdminApi.listTesters({
        search: search.trim() || undefined,
      });
      setTesters(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.container} testID="admin-testers-tab">
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder={t("testsAdmin.testers.searchPlaceholder")}
        placeholderTextColor={colors.textSecondary}
        testID="admin-testers-search"
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : testers.length === 0 ? (
        <Text style={styles.empty}>{t("testsAdmin.testers.empty")}</Text>
      ) : (
        <View style={styles.list} testID="admin-testers-list">
          {testers.map((tester) => (
            <View
              key={tester.id}
              style={styles.card}
              testID={`admin-tester-row-${tester.id}`}
            >
              <Text style={styles.name}>{tester.fullName}</Text>
              <View style={styles.statsRow}>
                <Stat
                  label={t("testsAdmin.testers.campaigns")}
                  value={tester.stats.campaignsCount}
                />
                <Stat
                  label={t("testsAdmin.testers.executions")}
                  value={tester.stats.executionsCount}
                />
                <Stat
                  label={t("testsAdmin.testers.passed")}
                  value={tester.stats.passedCount}
                  color="#20744A"
                />
                <Stat
                  label={t("testsAdmin.testers.failed")}
                  value={tester.stats.failedCount}
                  color={colors.notification}
                />
              </View>
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => setMessageTarget(tester)}
                testID={`admin-tester-message-${tester.id}`}
              >
                <Text style={styles.messageButtonText}>
                  {t("testsAdmin.detail.quickMessage")}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {messageTarget ? (
        <QuickMessageSheet
          tester={messageTarget}
          onClose={() => setMessageTarget(null)}
        />
      ) : null}
    </View>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  search: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  center: { paddingVertical: 32, alignItems: "center" },
  empty: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 24,
  },
  list: { gap: 12 },
  card: {
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E8DCCD",
  },
  name: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  statsRow: { flexDirection: "row", gap: 16 },
  stat: { gap: 2 },
  statValue: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  messageButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  messageButtonText: { fontSize: 12, fontWeight: "700", color: colors.primary },
});
