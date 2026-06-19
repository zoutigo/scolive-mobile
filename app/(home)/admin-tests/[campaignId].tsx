import { AppShell } from "../../../src/components/navigation/AppShell";
import { AdminCampaignDetailScreen } from "../../../src/components/tests-admin/AdminCampaignDetailScreen";

export default function AdminCampaignDetailRoute() {
  return (
    <AppShell showHeader={false}>
      <AdminCampaignDetailScreen />
    </AppShell>
  );
}
