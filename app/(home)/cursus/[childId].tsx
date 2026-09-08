import React, { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "../../../src/i18n/useTranslation";
import { useFamilyStore } from "../../../src/store/family.store";
import { buildChildHomeTarget } from "../../../src/components/navigation/nav-config";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { CursusScreen } from "../../../src/components/discipline/CursusScreen";

export default function CursusChildScreenRoute() {
  return (
    <AppShell showHeader={false}>
      <CursusChildScreen />
    </AppShell>
  );
}

function CursusChildScreen() {
  const { t } = useTranslation();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { children, setActiveChild } = useFamilyStore();

  const child = children.find((c) => c.id === childId) ?? null;
  const studentLabel = child
    ? `${child.lastName} ${child.firstName}`
    : t("discipline.cursus.subtitleDefault");

  useEffect(() => {
    if (!childId) return;
    setActiveChild(childId);
  }, [childId, setActiveChild]);

  return (
    <CursusScreen
      studentId={childId}
      studentLabel={studentLabel}
      onBack={() => router.push(buildChildHomeTarget(childId) as never)}
    />
  );
}
