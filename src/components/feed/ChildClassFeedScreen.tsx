import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { buildChildHomeTarget } from "../navigation/nav-config";
import { useDrawer } from "../navigation/drawer-context";
import { useAuthStore } from "../../store/auth.store";
import { useFamilyStore } from "../../store/family.store";
import { feedApi } from "../../api/feed.api";
import { timetableApi } from "../../api/timetable.api";
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

export function ChildClassFeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const params = useLocalSearchParams<{ childId?: string }>();
  const childId = typeof params.childId === "string" ? params.childId : "";
  const { schoolSlug, user } = useAuthStore();
  const viewerRole = resolveViewerRole(user?.activeRole ?? user?.role ?? null);
  const { children, setActiveChild, updateChild } = useFamilyStore();
  const [classId, setClassId] = useState<string | null>(null);
  const [className, setClassName] = useState<string | null>(null);

  const child = children.find((entry) => entry.id === childId);

  useEffect(() => {
    if (!childId) return;
    setActiveChild(childId);
  }, [childId, setActiveChild]);

  const subtitle = useMemo(() => {
    const childLabel = child ? `${child.firstName} ${child.lastName}` : "Élève";
    const resolvedClassLabel = className || child?.className?.trim() || "";
    return resolvedClassLabel
      ? `${childLabel} • ${resolvedClassLabel}`
      : childLabel;
  }, [child, className]);

  const ensureContext = useCallback(async () => {
    if (!schoolSlug || !childId) {
      throw new Error("Contexte enfant introuvable.");
    }

    if (child?.classId && child?.className) {
      setClassId(child.classId);
      setClassName(child.className);
      return child.classId;
    }

    const timetable = await timetableApi.getMyTimetable(schoolSlug, {
      childId,
    });
    setClassId(timetable.class.id);
    setClassName(timetable.class.name);
    updateChild(childId, {
      firstName: timetable.student.firstName,
      lastName: timetable.student.lastName,
      classId: timetable.class.id,
      className: timetable.class.name,
    });
    return timetable.class.id;
  }, [child, childId, schoolSlug, updateChild]);

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
      const resolvedClassId = classId ?? (await ensureContext());
      return feedApi.list(schoolSlug!, {
        viewScope: "CLASS",
        classId: resolvedClassId,
        filter,
        q: search || undefined,
        page,
        limit: 12,
      });
    },
    [classId, ensureContext, schoolSlug],
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
        <View style={styles.headerWrap}>
          <ModuleHeader
            title="Vie de classe"
            subtitle={subtitle}
            onBack={() => router.push(buildChildHomeTarget(childId) as never)}
            rightIcon="menu-outline"
            onRightPress={openDrawer}
            testID="child-class-feed-header"
            backTestID="child-class-feed-back"
            titleTestID="child-class-feed-header-title"
            subtitleTestID="child-class-feed-header-subtitle"
            rightTestID="child-class-feed-menu-btn"
            topInset={insets.top}
          />
        </View>
      )}
      loadPage={loadPage}
      testIDPrefix="child-class-feed"
      listTestID="child-class-feed-list"
      endOfListLabel="Fin des publications de classe"
      emptyTitle="Aucune actualité de classe"
      emptyMessage="Les informations collectives partagées à la classe apparaîtront ici."
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
