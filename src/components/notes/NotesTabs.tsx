import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { OnboardingTarget } from "../onboarding/OnboardingTarget";

export type NotesTabKey = "evaluations" | "notes" | "reports" | "decision";

interface NotesTab {
  key: NotesTabKey;
  labelKey: string;
}

interface Props {
  activeTab: NotesTabKey;
  onSelect: (tab: NotesTabKey) => void;
  /** Onboarding tour target id wrapping the tab row, if this screen should be spotlighted. */
  tourTargetId?: string;
  /** Only the referent teacher of the class may see the promotion decision tab. */
  showDecisionTab?: boolean;
}

const BASE_TABS: NotesTab[] = [
  { key: "evaluations", labelKey: "notes.tabs.evaluations" },
  { key: "notes", labelKey: "notes.tabs.notes" },
  { key: "reports", labelKey: "notes.tabs.reports" },
];

export function NotesTabs({
  activeTab,
  onSelect,
  tourTargetId,
  showDecisionTab,
}: Props) {
  const { t } = useTranslation();
  const tabs = showDecisionTab
    ? [
        ...BASE_TABS,
        { key: "decision" as const, labelKey: "notes.tabs.decision" },
      ]
    : BASE_TABS;
  const content = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onSelect(tab.key)}
            activeOpacity={0.7}
            testID={`notes-tab-${tab.key}`}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  if (tourTargetId) {
    return (
      <OnboardingTarget id={tourTargetId} style={styles.container}>
        {content}
      </OnboardingTarget>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  scroll: {
    paddingHorizontal: 12,
    paddingVertical: 0,
    gap: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
});
