import { AppShell } from "../../../../src/components/navigation/AppShell";
import { ClassHomeworkScreen } from "../../../../src/components/homework/ClassHomeworkScreen";

export default function TeacherClassHomeworkRoute() {
  return (
    <AppShell showHeader={false}>
      <ClassHomeworkScreen />
    </AppShell>
  );
}
