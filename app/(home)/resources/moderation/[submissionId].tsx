import { useLocalSearchParams } from "expo-router";
import { AppShell } from "../../../../src/components/navigation/AppShell";
import { ModerationReviewScreen } from "../../../../src/components/resources/ModerationReviewScreen";

export default function ResourceModerationReviewRoute() {
  const { submissionId, resourceId, part } = useLocalSearchParams<{
    submissionId: string;
    resourceId: string;
    part: "statement" | "correction";
  }>();
  return (
    <AppShell showHeader={false}>
      <ModerationReviewScreen
        submissionId={submissionId}
        resourceId={resourceId}
        part={part}
      />
    </AppShell>
  );
}
