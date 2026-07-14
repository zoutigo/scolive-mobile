import { AppShell } from "../../../../src/components/navigation/AppShell";
import { SchoolCurriculumOverviewScreen } from "../../../../src/components/schools/SchoolCurriculumOverviewScreen";

export default function SchoolCurriculumOverviewRoute() {
  return (
    <AppShell showHeader={false}>
      <SchoolCurriculumOverviewScreen />
    </AppShell>
  );
}
