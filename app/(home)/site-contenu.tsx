import { AppShell } from "../../src/components/navigation/AppShell";
import { SiteContentAdminScreen } from "../../src/components/site-content/SiteContentAdminScreen";

export default function SiteContentAdminRoute() {
  return (
    <AppShell showHeader={false}>
      <SiteContentAdminScreen />
    </AppShell>
  );
}
