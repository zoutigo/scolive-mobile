import React, { useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useFamilyStore } from "../../store/family.store";
import { useMessagingStore } from "../../store/messaging.store";
import { buildChildHomeTarget } from "../navigation/nav-config";
import { useHeaderScroll } from "../navigation/header-scroll-context";
import { useTranslation } from "../../i18n/useTranslation";
import type { AuthUser } from "../../types/auth.types";
import type { ParentChild } from "../../types/family.types";

interface ParentHomeProps {
  user: AuthUser;
  schoolSlug: string | null;
}

export function ParentHome({ schoolSlug }: ParentHomeProps) {
  const { t } = useTranslation();
  const { children, isLoading, setActiveChild } = useFamilyStore();
  const { unreadCount, loadUnreadCount } = useMessagingStore();
  const router = useRouter();
  const { onScroll } = useHeaderScroll();

  useEffect(() => {
    if (!schoolSlug) return;
    loadUnreadCount(schoolSlug).catch(() => {});
  }, [loadUnreadCount, schoolSlug]);

  function handleChildPress(child: ParentChild) {
    setActiveChild(child.id);
    router.push(buildChildHomeTarget(child.id) as never);
  }

  function handleQuickAccessPress(id: string, label: string) {
    if (id === "fil-d-actualit") {
      router.push("/(home)/feed");
      return;
    }

    if (id === "messagerie") {
      router.push("/(home)/messages");
      return;
    }

    router.push({
      pathname: "/placeholder",
      params: { title: label },
    });
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {/* Hero */}
      <View style={styles.banner}>
        <Text style={styles.greeting}>
          {t("home.hero.greeting")} {t("home.hero.role.parent")}
        </Text>
        <View style={[styles.rolePill, { backgroundColor: colors.warmAccent }]}>
          <Text style={styles.rolePillText}>{t("home.hero.role.parent")}</Text>
        </View>
      </View>

      {/* Mes enfants */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {t("home.parent.children.title")}
        </Text>
        {children.length > 0 && (
          <View style={styles.countBadge} testID="children-count-badge">
            <Text style={styles.countBadgeText}>{children.length}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : children.length === 0 ? (
        <View style={styles.childrenCard}>
          <View style={styles.childrenEmpty}>
            <Ionicons
              name="people-circle-outline"
              size={42}
              color={colors.warmBorder}
            />
            <Text style={styles.emptyTitle}>
              {t("home.parent.children.empty.title")}
            </Text>
            <Text style={styles.emptySub}>
              {t("home.parent.children.empty.subtitle")}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.childrenList}>
          {children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              onPress={handleChildPress}
            />
          ))}
        </View>
      )}

      {/* Accès rapides */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
        {t("home.parent.quickAccess.title")}
      </Text>
      <View style={styles.quickGrid}>
        {[
          {
            id: "fil-d-actualit",
            icon: "newspaper-outline",
            label: t("home.parent.quickAccess.feed.label"),
            sub: t("home.parent.quickAccess.feed.sub"),
            color: colors.primary,
          },
          {
            id: "finances",
            icon: "wallet-outline",
            label: t("home.parent.quickAccess.finance.label"),
            sub: t("home.parent.quickAccess.finance.sub"),
            color: colors.accentTeal,
          },
          {
            id: "messagerie",
            icon: "chatbubble-outline",
            label: t("home.parent.quickAccess.messaging.label"),
            sub: t("home.parent.quickAccess.messaging.sub"),
            color: "#6B5EA8",
          },
          {
            id: "documents",
            icon: "document-outline",
            label: t("home.parent.quickAccess.documents.label"),
            sub: t("home.parent.quickAccess.documents.sub"),
            color: colors.warmAccent,
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.quickCard}
            activeOpacity={0.75}
            onPress={() => handleQuickAccessPress(item.id, item.label)}
            testID={`quick-link-${item.id}`}
          >
            {item.id === "messagerie" && unreadCount > 0 ? (
              <View
                style={styles.quickBadge}
                testID="quick-link-messagerie-badge"
              >
                <Text style={styles.quickBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            ) : null}
            <View
              style={[styles.quickIcon, { backgroundColor: item.color + "18" }]}
            >
              <Ionicons
                name={item.icon as "home"}
                size={24}
                color={item.color}
              />
            </View>
            <Text style={styles.quickLabel}>{item.label}</Text>
            <Text style={styles.quickSub}>{item.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Actualités */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("home.parent.news.title")}</Text>
        <TouchableOpacity onPress={() => router.push("/(home)/feed")}>
          <Text style={styles.sectionLink}>{t("home.parent.news.seeAll")}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.newsCard}>
        <View style={styles.newsEmpty}>
          <Ionicons
            name="newspaper-outline"
            size={36}
            color={colors.warmBorder}
          />
          <Text style={styles.emptyTitle}>
            {t("home.parent.news.empty.title")}
          </Text>
          <Text style={styles.emptySub}>
            {t("home.parent.news.empty.subtitle")}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Carte enfant ─────────────────────────────────────────────────────────────

interface ChildCardProps {
  child: ParentChild;
  onPress: (child: ParentChild) => void;
}

function ChildCard({ child, onPress }: ChildCardProps) {
  return (
    <TouchableOpacity
      style={styles.childCard}
      activeOpacity={0.75}
      onPress={() => onPress(child)}
      testID={`child-card-${child.id}`}
    >
      <Text style={styles.childName}>
        {child.lastName} {child.firstName}
      </Text>
      <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.3)" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },

  banner: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  greeting: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  rolePill: {
    flexShrink: 0,
    marginLeft: 10,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rolePillText: { color: colors.white, fontSize: 11, fontWeight: "600" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionLink: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: { color: colors.white, fontSize: 12, fontWeight: "700" },

  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 32,
    alignItems: "center",
    marginBottom: 20,
  },

  childrenCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    overflow: "hidden",
    marginBottom: 20,
  },
  childrenEmpty: { alignItems: "center", padding: 32, gap: 8 },
  childrenList: {
    gap: 8,
    marginBottom: 20,
  },

  // Carte enfant — nom seul
  childCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  childName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    opacity: 0.7,
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  quickCard: {
    width: "47.5%",
    position: "relative",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 8,
  },
  quickBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  quickBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  quickSub: { fontSize: 12, color: colors.textSecondary },

  newsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    overflow: "hidden",
  },
  newsEmpty: { alignItems: "center", padding: 32, gap: 8 },
});
