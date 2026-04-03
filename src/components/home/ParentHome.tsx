import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import type { AuthUser } from "../../types/auth.types";

interface ParentHomeProps {
  user: AuthUser;
  schoolSlug: string | null;
}

export function ParentHome({ user, schoolSlug }: ParentHomeProps) {
  const schoolDisplay = schoolSlug
    ? schoolSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Mon établissement";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.bannerName}>
            {user.firstName} {user.lastName}
          </Text>
          <View style={styles.schoolRow}>
            <Ionicons name="business" size={13} color={colors.primary} />
            <Text style={styles.schoolLabel}>{schoolDisplay}</Text>
          </View>
        </View>
        <View style={[styles.rolePill, { backgroundColor: colors.warmAccent }]}>
          <Text style={styles.rolePillText}>Parent</Text>
        </View>
      </View>

      {/* My children */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes enfants</Text>
      </View>
      <View style={styles.childrenCard}>
        <View style={styles.childrenEmpty}>
          <Ionicons
            name="people-circle-outline"
            size={42}
            color={colors.warmBorder}
          />
          <Text style={styles.emptyTitle}>Aucun enfant associé</Text>
          <Text style={styles.emptySub}>
            Vos enfants inscrits apparaîtront ici
          </Text>
        </View>
      </View>

      {/* Quick links */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
        Accès rapides
      </Text>
      <View style={styles.quickGrid}>
        {[
          {
            icon: "newspaper-outline",
            label: "Fil d'actualité",
            sub: "Informations de l'école",
            color: colors.primary,
          },
          {
            icon: "wallet-outline",
            label: "Finances",
            sub: "Paiements et solde",
            color: colors.accentTeal,
          },
          {
            icon: "chatbubble-outline",
            label: "Messagerie",
            sub: "Contacter l'équipe",
            color: "#6B5EA8",
            badge: "1",
          },
          {
            icon: "document-outline",
            label: "Documents",
            sub: "Bulletins, certificats…",
            color: colors.warmAccent,
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.quickCard}
            activeOpacity={0.75}
          >
            <View
              style={[styles.quickIcon, { backgroundColor: item.color + "18" }]}
            >
              <Ionicons
                name={item.icon as "home"}
                size={24}
                color={item.color}
              />
              {item.badge && (
                <View
                  style={[styles.quickBadge, { backgroundColor: item.color }]}
                >
                  <Text style={styles.quickBadgeText}>{item.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.quickLabel}>{item.label}</Text>
            <Text style={styles.quickSub}>{item.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* School news placeholder */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Actualités</Text>
        <TouchableOpacity>
          <Text style={styles.sectionLink}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.newsCard}>
        <View style={styles.newsEmpty}>
          <Ionicons
            name="newspaper-outline"
            size={36}
            color={colors.warmBorder}
          />
          <Text style={styles.emptyTitle}>Aucune actualité</Text>
          <Text style={styles.emptySub}>
            Les informations de l'établissement apparaîtront ici
          </Text>
        </View>
      </View>
    </ScrollView>
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
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greeting: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  bannerName: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  schoolRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  schoolLabel: { fontSize: 13, color: colors.primary, fontWeight: "500" },
  rolePill: {
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

  childrenCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    overflow: "hidden",
  },
  childrenEmpty: {
    alignItems: "center",
    padding: 32,
    gap: 8,
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
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 8,
  },
  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  quickBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  quickBadgeText: { color: colors.white, fontSize: 10, fontWeight: "700" },
  quickLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  quickSub: { fontSize: 12, color: colors.textSecondary },

  newsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    overflow: "hidden",
  },
  newsEmpty: {
    alignItems: "center",
    padding: 32,
    gap: 8,
  },
});
