import { AppShell } from "../../../../../src/components/navigation/AppShell";
import { AddStudentToClassScreen } from "../../../../../src/components/classes/AddStudentToClassScreen";

export default function AddStudentToClassRoute() {
  return (
    <AppShell showHeader={false}>
      <AddStudentToClassScreen />
    </AppShell>
  );
}
