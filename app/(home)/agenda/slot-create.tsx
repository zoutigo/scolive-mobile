import React from "react";
import { useLocalSearchParams } from "expo-router";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { SlotCreateScreen } from "../../../src/components/timetable/SlotCreateScreen";
import { useAuthStore } from "../../../src/store/auth.store";
import { useTimetableStore } from "../../../src/store/timetable.store";

export default function AgendaSlotCreateRoute() {
  const params = useLocalSearchParams<{
    classId?: string;
    date?: string;
    teacherId?: string;
  }>();

  const { schoolSlug } = useAuthStore();
  const { classOptions } = useTimetableStore();

  const prefilledClassId =
    typeof params.classId === "string" && params.classId
      ? params.classId
      : undefined;
  const prefilledDate =
    typeof params.date === "string" && params.date ? params.date : undefined;
  const prefilledTeacherId =
    typeof params.teacherId === "string" && params.teacherId
      ? params.teacherId
      : undefined;

  const allClasses = classOptions?.classes ?? [];

  return (
    <AppShell showHeader={false}>
      <SlotCreateScreen
        schoolSlug={schoolSlug ?? ""}
        prefilledClassId={prefilledClassId}
        prefilledDate={prefilledDate}
        prefilledTeacherId={prefilledTeacherId}
        allClasses={allClasses}
        onSuccess={() => {}}
      />
    </AppShell>
  );
}
