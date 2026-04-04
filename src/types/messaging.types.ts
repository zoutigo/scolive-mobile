export type FolderKey = "inbox" | "sent" | "drafts" | "archive";

export type MessageSender = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
};

export type MessageAttachment = {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
};

export type MessageListItem = {
  id: string;
  folder: FolderKey;
  status: "DRAFT" | "SENT";
  subject: string;
  preview: string;
  createdAt: string;
  sentAt: string | null;
  unread: boolean;
  sender: MessageSender | null;
  recipientsCount: number;
  mailboxEntryId: string;
  attachments: MessageAttachment[];
};

export type MessageRecipient = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  readAt: string | null;
  archivedAt: string | null;
};

export type MessageDetail = {
  id: string;
  subject: string;
  body: string;
  status: "DRAFT" | "SENT";
  createdAt: string;
  sentAt: string | null;
  senderArchivedAt: string | null;
  isSender: boolean;
  recipientState: {
    readAt: string | null;
    archivedAt: string | null;
    deletedAt: string | null;
  } | null;
  sender: MessageSender | null;
  recipients: MessageRecipient[];
  attachments: MessageAttachment[];
};

export type MessagesMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type RecipientOption = {
  value: string;
  label: string;
  email?: string;
  subtitle?: string;
};

export type MessagingRecipients = {
  teachers: Array<{
    value: string;
    label: string;
    email?: string;
    classes?: string[];
    subjects?: string[];
  }>;
  staffFunctions: Array<{
    value: string;
    label: string;
    description?: string | null;
    members: Array<{
      userId: string;
      fullName: string;
      email: string;
    }>;
  }>;
  staffPeople: Array<{
    value: string;
    label: string;
    email: string;
    functionId: string;
    functionLabel: string;
  }>;
};
