import { AppShell } from "../../../../src/components/navigation/AppShell";
import { TeacherClassFeedScreen } from "../../../../src/components/feed/TeacherClassFeedScreen";

export default function TeacherClassFeedRoute() {
  return (
    <AppShell showHeader={false}>
      <TeacherClassFeedScreen />
    </AppShell>
  );
}
