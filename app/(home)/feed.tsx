import React, { useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../src/store/auth.store";
import { useFeedStore } from "../../src/store/feed.store";
import { feedApi } from "../../src/api/feed.api";
import { FeedModuleScreen } from "../../src/components/feed/FeedModuleScreen";
import { AppShell } from "../../src/components/navigation/AppShell";
import { useDrawer } from "../../src/components/navigation/drawer-context";
import { ModuleHeader } from "../../src/components/navigation/ModuleHeader";
import { buildTeacherSubtitle } from "../../src/components/navigation/nav-config";
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
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { schoolSlug, user } = useAuthStore();
  const viewerRole = resolveViewerRole(user?.activeRole ?? user?.role ?? null);
  const subtitle = user ? buildTeacherSubtitle(user) : null;

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
      renderHeader={() => (
        <ModuleHeader
          title="Fil d'actualité"
          subtitle={subtitle}
          onBack={() => router.back()}
          rightIcon="menu-outline"
          onRightPress={openDrawer}
          testID="feed-header"
          backTestID="feed-back-btn"
          rightTestID="feed-menu-btn"
        />
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
