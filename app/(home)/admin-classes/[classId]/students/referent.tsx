import { AppShell } from "../../../../../src/components/navigation/AppShell";
import { SetClassReferentTeacherScreen } from "../../../../../src/components/classes/SetClassReferentTeacherScreen";

export default function SetClassReferentTeacherRoute() {
  return (
    <AppShell showHeader={false}>
      <SetClassReferentTeacherScreen />
    </AppShell>
  );
}
