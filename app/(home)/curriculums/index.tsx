import { AppShell } from "../../../src/components/navigation/AppShell";
import { CurriculumsAdminScreen } from "../../../src/components/curriculums/CurriculumsAdminScreen";

export default function CurriculumsRoute() {
  return (
    <AppShell showHeader={false}>
      <CurriculumsAdminScreen />
    </AppShell>
  );
}
