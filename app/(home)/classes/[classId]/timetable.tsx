import { useLocalSearchParams } from "expo-router";
import { AppShell } from "../../../../src/components/navigation/AppShell";
import { TeacherAgendaScreenInner } from "../../../../src/components/timetable/TeacherAgendaScreen";
import { useTeacherClassNavStore } from "../../../../src/store/teacher-class-nav.store";

export default function TeacherClassTimetableRoute() {
  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
  const classOptions = useTeacherClassNavStore((state) => state.classOptions);
  const lockedClassName =
    classOptions?.classes.find((item) => item.classId === classId)?.className ??
    null;

  return (
    <AppShell showHeader={false}>
      <TeacherAgendaScreenInner
        initialTab="classes"
        lockedClassId={classId}
        lockedClassName={lockedClassName ?? undefined}
        hideClassPicker
      />
    </AppShell>
  );
}
