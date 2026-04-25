export type TicketType = "BUG" | "FEATURE_REQUEST";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "ANSWERED"
  | "RESOLVED"
  | "CLOSED";

export interface TicketAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  email?: string | null;
}

export interface TicketAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface TicketVote {
  id: string;
  userId: string;
  user: TicketAuthor;
  createdAt: string;
}

export interface TicketResponse {
  id: string;
  body: string;
  isInternal: boolean;
  author: TicketAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface TicketSchool {
  id: string;
  name: string;
  slug: string;
}

export interface TicketListItem {
  id: string;
  type: TicketType;
  status: TicketStatus;
  title: string;
  description: string;
  platform?: string | null;
  author: TicketAuthor;
  school?: TicketSchool | null;
  attachments: TicketAttachment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  _count: { votes: number; responses: number };
}

export interface TicketDetail extends Omit<TicketListItem, "_count"> {
  appVersion?: string | null;
  screenPath?: string | null;
  responses: TicketResponse[];
  votes: TicketVote[];
  _count: { votes: number };
}

export interface TicketsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TicketsListResponse {
  data: TicketListItem[];
  meta: TicketsMeta;
}

export interface CreateTicketPayload {
  type: TicketType;
  title: string;
  description: string;
  schoolSlug?: string;
  platform?: string;
  appVersion?: string;
  screenPath?: string;
  attachments?: Array<{
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
  }>;
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  ANSWERED: "Répondu",
  RESOLVED: "Résolu",
  CLOSED: "Fermé",
};

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  BUG: "Bug",
  FEATURE_REQUEST: "Suggestion",
};
