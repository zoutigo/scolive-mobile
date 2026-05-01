import React, { useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { useDrawer } from "../navigation/drawer-context";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { useAuthStore } from "../../store/auth.store";
import { useTeacherClassNavStore } from "../../store/teacher-class-nav.store";
import { feedApi } from "../../api/feed.api";
import { FeedModuleScreen } from "./FeedModuleScreen";
import type {
  CreateFeedPayload,
  FeedFilter,
  FeedViewerRole,
} from "../../types/feed.types";

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

export function TeacherClassFeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
  const { schoolSlug, user } = useAuthStore();
  const viewerRole = resolveViewerRole(user?.activeRole ?? user?.role ?? null);
  const classOptions = useTeacherClassNavStore((state) => state.classOptions);
  const className =
    classOptions?.classes.find((entry) => entry.classId === classId)
      ?.className ?? null;
  const subtitle =
    className ?? (classId ? `Classe ${classId}` : "Classe active");

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
        throw new Error("Contexte classe introuvable.");
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
        throw new Error("Contexte classe introuvable.");
      }

      return feedApi.create(schoolSlug, {
        ...payload,
        audienceScope: "CLASS",
        audienceClassId: classId,
        audienceLabel: className ? `Classe ${className}` : `Classe ${classId}`,
      });
    },
    [classId, className, schoolSlug],
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
        <View style={styles.headerWrap}>
          <ModuleHeader
            title="Vie de classe"
            subtitle={subtitle}
            onBack={() => router.back()}
            rightIcon="menu-outline"
            onRightPress={openDrawer}
            testID="teacher-class-feed-header"
            backTestID="teacher-class-feed-back"
            titleTestID="teacher-class-feed-title"
            subtitleTestID="teacher-class-feed-subtitle"
            rightTestID="teacher-class-feed-menu-btn"
            topInset={insets.top}
          />
        </View>
      )}
      loadPage={loadPage}
      testIDPrefix="teacher-class-feed"
      listTestID="teacher-class-feed-list"
      endOfListLabel="Fin des publications de classe"
      emptyTitle="Aucune actualité de classe"
      emptyMessage="Les informations partagées avec cette classe apparaîtront ici."
      deleteSuccessMessage="Cette publication n'apparaît plus dans la vie de classe."
      deleteContextLabel="fil de classe"
      heroSearchEnabled
      heroComposerActionsEnabled
      canCompose
      onCreatePost={handleCreatePost}
      onUploadInlineImage={handleUploadInlineImage}
    />
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: 16,
  },
});
