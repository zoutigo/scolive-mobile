import { useLocalSearchParams } from "expo-router";
import { AppShell } from "../../../../src/components/navigation/AppShell";
import { TeacherAgendaScreenInner } from "../../../../src/components/timetable/TeacherAgendaScreen";
import { useTeacherClassNavStore } from "../../../../src/store/teacher-class-nav.store";
import { useTranslation } from "../../../../src/i18n/useTranslation";

export default function TeacherClassTimetableRoute() {
  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
  const classOptions = useTeacherClassNavStore((state) => state.classOptions);
  const lockedClassName =
    classOptions?.classes.find((item) => item.classId === classId)?.className ??
    null;
  const { t } = useTranslation();

  return (
    <AppShell showHeader={false}>
      <TeacherAgendaScreenInner
        initialTab="classes"
        lockedClassId={classId}
        lockedClassName={lockedClassName ?? undefined}
        hideClassPicker
        headerTitle={t("classRoute.timetable.headerTitle")}
        lockedClassTabLabel={t("classRoute.timetable.tabLabel")}
      />
    </AppShell>
  );
}
