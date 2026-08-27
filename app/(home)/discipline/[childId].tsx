import React, { useCallback, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "../../../src/i18n/useTranslation";
import { useFamilyStore } from "../../../src/store/family.store";
import { buildChildHomeTarget } from "../../../src/components/navigation/nav-config";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { DisciplineSelfScreen } from "../../../src/components/discipline/DisciplineSelfScreen";

export default function DisciplineChildScreenRoute() {
  return (
    <AppShell showHeader={false}>
      <DisciplineChildScreen />
    </AppShell>
  );
}

function DisciplineChildScreen() {
  const { t } = useTranslation();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { children, setActiveChild, updateChild } = useFamilyStore();

  const child = children.find((c) => c.id === childId) ?? null;
  const studentLabel = child
    ? `${child.lastName} ${child.firstName}`
    : t("discipline.header.student");

  useEffect(() => {
    if (!childId) return;
    setActiveChild(childId);
  }, [childId, setActiveChild]);

  const handleClassLabelResolved = useCallback(
    (classLabel: string) => {
      if (!childId || child?.className === classLabel) return;
      updateChild(childId, { className: classLabel });
    },
    [childId, child?.className, updateChild],
  );

  return (
    <DisciplineSelfScreen
      studentId={childId}
      studentLabel={studentLabel}
      onBack={() => router.push(buildChildHomeTarget(childId) as never)}
      onClassLabelResolved={handleClassLabelResolved}
      viewerRole="parent"
    />
  );
}
