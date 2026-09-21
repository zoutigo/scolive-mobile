import { AppShell } from "../../../src/components/navigation/AppShell";
import { StudentAdmissionsAdminScreen } from "../../../src/components/students/StudentAdmissionsAdminScreen";

export default function StudentAdmissionsRoute() {
  return (
    <AppShell showHeader={false}>
      <StudentAdmissionsAdminScreen />
    </AppShell>
  );
}
