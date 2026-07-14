import type { ResourceAttachment } from "../types/resources.types";

/**
 * Strips server-only fields (`id`, `part`) before resending attachments in a
 * save/submit payload. Attachments loaded from a submission carry these
 * fields, but the create/update DTO whitelist rejects unknown properties
 * (forbidNonWhitelisted), so re-sending them as-is fails with
 * "attachments.0.property id should not exist".
 */
export function toAttachmentPayload(
  attachments: ResourceAttachment[],
): ResourceAttachment[] {
  return attachments.map((attachment) => ({
    fileName: attachment.fileName,
    fileUrl: attachment.fileUrl,
    mimeType: attachment.mimeType,
    sizeLabel: attachment.sizeLabel,
  }));
}
