import React, { useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../src/store/auth.store";
import { useFeedStore } from "../../src/store/feed.store";
import { feedApi } from "../../src/api/feed.api";
import { useTranslation } from "../../src/i18n/useTranslation";
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
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;
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
        throw new Error(tRef.current("feed.errors.schoolMissing"));
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
          title={t("feed.page.title")}
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
      endOfListLabel={t("feed.page.endOfList")}
      emptyTitle={t("feed.page.emptyTitle")}
      emptyMessage={t("feed.page.emptyMessage")}
      deleteSuccessMessage={t("feed.page.deleteSuccess")}
      deleteContextLabel={t("feed.page.context")}
      canCompose
      heroTitle={t("feed.page.heroTitle")}
      heroSubtitle={t("feed.page.heroSubtitle")}
      onCreatePost={handleCreatePost}
      onUploadInlineImage={handleUploadInlineImage}
      onPostsChange={(posts) => {
        useFeedStore.setState((state) => ({ ...state, posts }));
      }}
    />
  );
}
