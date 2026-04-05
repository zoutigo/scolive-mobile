export type SessionExpiredPayload = {
  message: string;
  statusCode?: number;
};

type SessionExpiredHandler = (
  payload: SessionExpiredPayload,
) => void | Promise<void>;

let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function registerSessionExpiredHandler(
  handler: SessionExpiredHandler | null,
) {
  sessionExpiredHandler = handler;
}

export async function notifySessionExpired(payload: SessionExpiredPayload) {
  if (!sessionExpiredHandler) return;
  await sessionExpiredHandler(payload);
}
