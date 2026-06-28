import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { buildChildHomeTarget } from "../navigation/nav-config";
import { useAuthStore } from "../../store/auth.store";
import { useFamilyStore } from "../../store/family.store";
import { feedApi } from "../../api/feed.api";
import { timetableApi } from "../../api/timetable.api";
import { useTranslation } from "../../i18n/useTranslation";
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
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
    const childLabel = child
      ? `${child.firstName} ${child.lastName}`
      : t("feed.classLife.studentFallback");
    const resolvedClassLabel = className || child?.className?.trim() || "";
    return resolvedClassLabel
      ? `${childLabel} • ${resolvedClassLabel}`
      : childLabel;
  }, [child, className, t]);

  const ensureContext = useCallback(async () => {
    if (!schoolSlug || !childId) {
      throw new Error(tRef.current("feed.errors.childContextMissing"));
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
        <View style={styles.headerWrap}>
          <ModuleHeader
            title={t("feed.classLife.title")}
            subtitle={subtitle}
            onBack={() => router.push(buildChildHomeTarget(childId) as never)}
            testID="child-class-feed-header"
            backTestID="child-class-feed-back"
            titleTestID="child-class-feed-header-title"
            subtitleTestID="child-class-feed-header-subtitle"
            topInset={insets.top}
          />
        </View>
      )}
      loadPage={loadPage}
      testIDPrefix="child-class-feed"
      listTestID="child-class-feed-list"
      endOfListLabel={t("feed.classLife.endOfList")}
      emptyTitle={t("feed.classLife.emptyTitle")}
      emptyMessage={t("feed.classLife.emptyMessageChild")}
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
