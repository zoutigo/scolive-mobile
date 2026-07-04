import React, { useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../src/store/auth.store";
import { useFeedStore } from "../../src/store/feed.store";
import { feedApi } from "../../src/api/feed.api";
import { useTranslation } from "../../src/i18n/useTranslation";
import { FeedModuleScreen } from "../../src/components/feed/FeedModuleScreen";
import { AppShell } from "../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../src/components/navigation/ModuleHeader";
import { buildTeacherSubtitle } from "../../src/components/navigation/nav-config";
import type {
  CreateFeedPayload,
  FeedFilter,
  FeedViewerRole,
} from "../../src/types/feed.types";
import { moduleBack } from "../../src/utils/moduleBack";

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

  const handleUploadAttachment = useCallback(
    async (file: { uri: string; mimeType: string; fileName: string }) => {
      if (!schoolSlug) {
        throw new Error(tRef.current("feed.errors.schoolMissing"));
      }
      return feedApi.uploadAttachment(schoolSlug, file);
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
          onBack={() => moduleBack(router)}
          testID="feed-header"
          backTestID="feed-back-btn"
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
      onCreatePost={handleCreatePost}
      onUploadInlineImage={handleUploadInlineImage}
      onUploadAttachment={handleUploadAttachment}
      onPostsChange={(posts) => {
        useFeedStore.setState((state) => ({ ...state, posts }));
      }}
    />
  );
}
