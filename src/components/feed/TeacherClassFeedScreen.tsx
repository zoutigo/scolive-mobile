import React, { useCallback, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { useAuthStore } from "../../store/auth.store";
import { useTeacherClassNavStore } from "../../store/teacher-class-nav.store";
import { feedApi } from "../../api/feed.api";
import { useTranslation } from "../../i18n/useTranslation";
import { FeedModuleScreen } from "./FeedModuleScreen";
import type {
  CreateFeedPayload,
  FeedFilter,
  FeedViewerRole,
} from "../../types/feed.types";
import { moduleBack } from "../../utils/moduleBack";

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

export function TeacherClassFeedScreen({
  showHeader = true,
}: {
  showHeader?: boolean;
} = {}) {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
  const { schoolSlug, user } = useAuthStore();
  const viewerRole = resolveViewerRole(user?.activeRole ?? user?.role ?? null);
  const classOptions = useTeacherClassNavStore((state) => state.classOptions);
  const className =
    classOptions?.classes.find((entry) => entry.classId === classId)
      ?.className ?? null;
  const subtitle =
    className ??
    (classId
      ? t("feed.classLife.classWithId").replace("{classId}", classId)
      : t("feed.classLife.classActive"));

  const loadPage = useCallback(
    async ({
      page,
      filter,
      search,
    }: {
      page: number;
      filter: FeedFilter;
      search: string;
    }) => {
      if (!schoolSlug || !classId) {
        throw new Error(tRef.current("feed.errors.classContextMissing"));
      }

      return feedApi.list(schoolSlug, {
        viewScope: "CLASS",
        classId,
        filter,
        q: search || undefined,
        page,
        limit: 12,
      });
    },
    [classId, schoolSlug],
  );

  const handleCreatePost = useCallback(
    async (payload: CreateFeedPayload) => {
      if (!schoolSlug || !classId) {
        throw new Error(tRef.current("feed.errors.classContextMissing"));
      }

      return feedApi.create(schoolSlug, {
        ...payload,
        audienceScope: "CLASS",
        audienceClassId: classId,
        audienceLabel: tRef
          .current("feed.audience.classLabel")
          .replace("{name}", className ?? classId),
      });
    },
    [classId, className, schoolSlug],
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
      renderHeader={() =>
        showHeader ? (
          <View style={styles.headerWrap}>
            <ModuleHeader
              title={t("feed.classLife.title")}
              subtitle={subtitle}
              onBack={() => moduleBack(router)}
              testID="teacher-class-feed-header"
              backTestID="teacher-class-feed-back"
              titleTestID="teacher-class-feed-title"
              subtitleTestID="teacher-class-feed-subtitle"
              topInset={insets.top}
            />
          </View>
        ) : null
      }
      loadPage={loadPage}
      testIDPrefix="teacher-class-feed"
      listTestID="teacher-class-feed-list"
      endOfListLabel={t("feed.classLife.endOfList")}
      emptyTitle={t("feed.classLife.emptyTitle")}
      emptyMessage={t("feed.classLife.emptyMessageTeacher")}
      deleteSuccessMessage={t("feed.classLife.deleteSuccess")}
      deleteContextLabel={t("feed.classLife.context")}
      canCompose
      onCreatePost={handleCreatePost}
      onUploadInlineImage={handleUploadInlineImage}
    />
  );
}

const styles = StyleSheet.create({
  headerWrap: {},
});
