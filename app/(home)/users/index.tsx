import { AppShell } from "../../../src/components/navigation/AppShell";
import { SchoolAdminUsersScreen } from "../../../src/components/users/SchoolAdminUsersScreen";

export default function UsersRoute() {
  return (
    <AppShell showHeader={false}>
      <SchoolAdminUsersScreen />
    </AppShell>
  );
}
