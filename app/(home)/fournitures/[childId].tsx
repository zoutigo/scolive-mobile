import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "../../../src/i18n/useTranslation";
import { useFamilyStore } from "../../../src/store/family.store";
import { buildChildHomeTarget } from "../../../src/components/navigation/nav-config";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { SupplyListScreen } from "../../../src/components/supply-lists/SupplyListScreen";

export default function SupplyListChildScreenRoute() {
  return (
    <AppShell showHeader={false}>
      <SupplyListChildScreen />
    </AppShell>
  );
}

function SupplyListChildScreen() {
  const { t } = useTranslation();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { children } = useFamilyStore();

  const child = children.find((c) => c.id === childId) ?? null;
  const studentLabel = child
    ? `${child.lastName} ${child.firstName}`
    : t("supplyList.screen.title");

  return (
    <SupplyListScreen
      studentId={childId}
      studentLabel={studentLabel}
      viewerRole="parent"
      onBack={() => router.push(buildChildHomeTarget(childId) as never)}
    />
  );
}
