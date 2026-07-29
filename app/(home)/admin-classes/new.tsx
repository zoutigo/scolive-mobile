import { AppShell } from "../../../src/components/navigation/AppShell";
import { CreateClassScreen } from "../../../src/components/classes/CreateClassScreen";

export default function CreateClassRoute() {
  return (
    <AppShell showHeader={false}>
      <CreateClassScreen />
    </AppShell>
  );
}
