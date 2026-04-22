import React, { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../src/theme";
import { useAuthStore } from "../../src/store/auth.store";
import { useFeedStore } from "../../src/store/feed.store";
import { feedApi } from "../../src/api/feed.api";
import { FeedModuleScreen } from "../../src/components/feed/FeedModuleScreen";
import { AppShell } from "../../src/components/navigation/AppShell";
import { useDrawer } from "../../src/components/navigation/drawer-context";
import { HeaderBackButton } from "../../src/components/navigation/HeaderBackButton";
import { HeaderMenuButton } from "../../src/components/navigation/HeaderMenuButton";
import type {
  CreateFeedPayload,
  FeedFilter,
  FeedViewerRole,
} from "../../src/types/feed.types";

const FEED_ROLES: FeedViewerRole[] = [
  "SCHOOL_ADMIN",
  "SCHOOL_MANAGER",
  "SUPERVISOR",
  "SCHOOL_ACCOUNTANT",
  "SCHOOL_STAFF",
  "TEACHER",
  "PARENT",
  "STUDENT",
];

function resolveViewerRole(
  role: string | null | undefined,
): FeedViewerRole | null {
  if (!role) return null;
  return FEED_ROLES.includes(role as FeedViewerRole)
    ? (role as FeedViewerRole)
    : null;
}

export default function FeedScreenRoute() {
  return (
    <AppShell showHeader={false}>
      <FeedScreen />
    </AppShell>
  );
}

function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { schoolSlug, user } = useAuthStore();
  const viewerRole = resolveViewerRole(user?.activeRole ?? user?.role ?? null);

  const loadPage = useCallback(
    async ({
      page,
      filter,
      search,
    }: {
      page: number;
      filter: FeedFilter;
      search: string;
    }) =>
      feedApi.list(schoolSlug!, {
        filter,
        q: search || undefined,
        page,
        limit: 12,
      }),
    [schoolSlug],
  );

  const handleCreatePost = useCallback(
    async (payload: CreateFeedPayload) => feedApi.create(schoolSlug!, payload),
    [schoolSlug],
  );

  const handleUploadInlineImage = useCallback(
    async (file: { uri: string; name: string; mimeType: string }) => {
      if (!schoolSlug) {
        throw new Error("Établissement introuvable");
      }
      return feedApi.uploadInlineImage(schoolSlug, file);
    },
    [schoolSlug],
  );

  return (
    <FeedModuleScreen
      schoolSlug={schoolSlug}
      viewerRole={viewerRole}
      renderHeader={({ toggleSearch }) => (
        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <HeaderBackButton
            onPress={() => router.back()}
            testID="feed-back-btn"
          />
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Fil d&apos;actualité</Text>
          </View>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={toggleSearch}
            testID="feed-search-btn"
          >
            <Ionicons name="search-outline" size={20} color={colors.white} />
          </TouchableOpacity>
          <HeaderMenuButton onPress={openDrawer} testID="feed-menu-btn" />
        </View>
      )}
      loadPage={loadPage}
      testIDPrefix="feed"
      listTestID="feed-list"
      endOfListLabel="Vous avez atteint la fin du fil"
      emptyTitle="Aucune actualité pour le moment"
      emptyMessage="Les informations importantes de l'établissement apparaîtront ici."
      deleteSuccessMessage="Cette actualité n'apparaît plus dans le fil."
      deleteContextLabel="fil d'actualité"
      canCompose
      heroTitle="Partager une annonce utile"
      heroSubtitle="Informations d'école, rappels, sondages et vie quotidienne."
      onCreatePost={handleCreatePost}
      onUploadInlineImage={handleUploadInlineImage}
      onPostsChange={(posts) => {
        useFeedStore.setState((state) => ({ ...state, posts }));
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
    textTransform: "uppercase",
    textAlign: "center",
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
});
