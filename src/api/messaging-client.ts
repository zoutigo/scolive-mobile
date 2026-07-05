import { messagingApi } from "./messaging.api";
import { adminMessagingApi } from "./admin-messaging.api";
import type {
  FolderKey,
  MessageDetail,
  MessagesMeta,
  MessageListItem,
  MessagingRecipients,
  RecipientOption,
} from "../types/messaging.types";

/** Special scope key used for the platform-admin aggregated mailbox. */
export const PLATFORM_SCOPE = "platform" as const;

export type MessagingScope = string | typeof PLATFORM_SCOPE;

type ListParams = {
  folder: FolderKey;
  q?: string;
  page?: number;
  limit?: number;
};

export type MessagingClient = {
  list: (
    params: ListParams,
  ) => Promise<{ items: MessageListItem[]; meta: MessagesMeta }>;
  get: (messageId: string) => Promise<MessageDetail>;
  unreadCount: () => Promise<number>;
  send: (payload: {
    subject: string;
    body: string;
    recipientUserIds: string[];
    isDraft?: boolean;
    attachments?: Array<{
      uri: string;
      name: string;
      mimeType: string;
      size?: number;
    }>;
    forwardAttachmentIds?: string[];
  }) => Promise<void>;
  updateDraft: (
    messageId: string,
    payload: {
      subject?: string;
      body?: string;
      recipientUserIds?: string[];
      attachments?: Array<{
        fileName: string;
        fileUrl: string;
        mimeType: string;
        sizeBytes: number;
      }>;
    },
  ) => Promise<MessageDetail>;
  uploadAttachment: (file: {
    uri: string;
    mimeType: string;
    fileName: string;
  }) => Promise<{
    fileName: string;
    fileUrl: string;
    mimeType: string;
    sizeBytes: number;
  }>;
  sendDraft: (messageId: string) => Promise<void>;
  markRead: (messageId: string, read: boolean) => Promise<void>;
  archive: (messageId: string, archived: boolean) => Promise<void>;
  remove: (messageId: string) => Promise<void>;
  uploadInlineImage: (
    fileUri: string,
    mimeType: string,
    fileName: string,
  ) => Promise<string>;
  /** Static recipient pool (teachers/staff) — school scope only. */
  getRecipients?: () => Promise<MessagingRecipients>;
  /**
   * Remote recipient search across the whole platform — admin scope only.
   * When present, the compose screen switches to a search box instead of
   * the static teacher/staff picker.
   */
  searchRecipients?: (query: string) => Promise<RecipientOption[]>;
};

function createSchoolMessagingClient(schoolSlug: string): MessagingClient {
  return {
    list: (params) => messagingApi.list(schoolSlug, params),
    get: (messageId) => messagingApi.get(schoolSlug, messageId),
    unreadCount: () => messagingApi.unreadCount(schoolSlug),
    send: (payload) => messagingApi.send(schoolSlug, payload),
    updateDraft: (messageId, payload) =>
      messagingApi.updateDraft(schoolSlug, messageId, payload),
    uploadAttachment: (file) => messagingApi.uploadAttachment(schoolSlug, file),
    sendDraft: (messageId) => messagingApi.sendDraft(schoolSlug, messageId),
    markRead: (messageId, read) =>
      messagingApi.markRead(schoolSlug, messageId, read),
    archive: (messageId, archived) =>
      messagingApi.archive(schoolSlug, messageId, archived),
    remove: (messageId) => messagingApi.remove(schoolSlug, messageId),
    uploadInlineImage: (fileUri, mimeType, fileName) =>
      messagingApi.uploadInlineImage(schoolSlug, fileUri, mimeType, fileName),
    getRecipients: () => messagingApi.getRecipients(schoolSlug),
  };
}

function createAdminMessagingClient(): MessagingClient {
  return {
    list: (params) => adminMessagingApi.list(params),
    get: (messageId) => adminMessagingApi.get(messageId),
    unreadCount: () => adminMessagingApi.unreadCount(),
    send: (payload) => adminMessagingApi.send(payload),
    updateDraft: (messageId, payload) =>
      adminMessagingApi.updateDraft(messageId, payload),
    uploadAttachment: (file) => adminMessagingApi.uploadAttachment(file),
    sendDraft: (messageId) => adminMessagingApi.sendDraft(messageId),
    markRead: (messageId, read) => adminMessagingApi.markRead(messageId, read),
    archive: (messageId, archived) =>
      adminMessagingApi.archive(messageId, archived),
    remove: (messageId) => adminMessagingApi.remove(messageId),
    uploadInlineImage: (fileUri, mimeType, fileName) =>
      adminMessagingApi.uploadInlineImage(fileUri, mimeType, fileName),
    searchRecipients: (query) => adminMessagingApi.searchRecipients(query),
  };
}

export function getMessagingClient(scope: MessagingScope): MessagingClient {
  if (scope === PLATFORM_SCOPE) {
    return createAdminMessagingClient();
  }
  return createSchoolMessagingClient(scope);
}
