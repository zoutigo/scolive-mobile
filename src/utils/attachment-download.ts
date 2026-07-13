import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

function sanitizeFileName(name: string): string {
  const trimmed = name.trim();
  const safe = trimmed.replace(/[\\/:*?"<>|]/g, "_");
  return safe.length > 0 ? safe : "attachment";
}

/**
 * Downloads a remote attachment into the app cache, then opens the native
 * share/open-with sheet on top of the app. Using Linking.openURL instead
 * would hand the file off to an external browser tab, which is what users
 * perceived as "leaving the app" to view an attachment.
 */
export async function downloadAndOpenAttachment(attachment: {
  fileUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
}): Promise<void> {
  if (!attachment.fileUrl) {
    throw new Error("Missing attachment URL");
  }
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing not available on this device");
  }
  const destination = new File(
    new Directory(Paths.cache, "attachments"),
    sanitizeFileName(attachment.fileName ?? "attachment"),
  );
  destination.parentDirectory.create({ intermediates: true, idempotent: true });
  const file = await File.downloadFileAsync(attachment.fileUrl, destination, {
    idempotent: true,
  });
  await Sharing.shareAsync(file.uri, {
    mimeType: attachment.mimeType ?? undefined,
    UTI: attachment.mimeType ?? undefined,
  });
}
