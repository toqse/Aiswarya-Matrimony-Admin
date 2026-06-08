import { BASE_URL } from "./config";
import { memberFetchWithAuthRetry } from "@/lib/memberAuthedFetch";
import { useAuthStore } from "@/stores/authStore";

type ApiErrorPayload = {
  success?: boolean;
  error?: { code?: number; message?: string; details?: unknown };
  detail?: string | string[];
  message?: string;
  [key: string]: unknown;
};

const getErrorMessage = (data: ApiErrorPayload | unknown, fallback: string): string => {
  const payload = (data ?? {}) as ApiErrorPayload;
  if (payload.error?.message) return payload.error.message;
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload.detail === "string" && payload.detail.trim()) return payload.detail;
  if (Array.isArray(payload.detail) && payload.detail[0]) return String(payload.detail[0]);
  return fallback;
};

const logApi = (endpoint: string, method: string, body?: unknown, response?: { status: number; data: unknown }) => {
  try {
    // eslint-disable-next-line no-console
    console.log("[chatApi]", method, endpoint, body ?? "");
    if (response) {
      // eslint-disable-next-line no-console
      console.log("[chatApi] response", response);
    }
  } catch {
    // ignore
  }
};

async function authedFetch<T>(path: string, opts: { method: string; body?: string }): Promise<T> {
  const url = `${BASE_URL}${path}`;

  logApi(path, opts.method, opts.body ? JSON.parse(opts.body) : undefined);

  const res = await memberFetchWithAuthRetry(url, {
    method: opts.method,
    headers: { "Content-Type": "application/json" },
    ...(opts.body !== undefined && { body: opts.body }),
  });

  const data = (await res.json().catch(() => ({}))) as T & ApiErrorPayload;
  logApi(path, opts.method, undefined, { status: res.status, data });

  if (!res.ok) throw new Error(getErrorMessage(data, "Request failed"));
  return data as T;
}

export interface ChatListItem {
  conversation_id: number;
  other_user: {
    matri_id: string;
    name: string;
    profile_photo: string | null;
  };
  last_message: {
    preview: string;
    timestamp: string;
  } | null;
  unread_count: number;
  updated_at: string;
}

export interface ChatListResponse {
  success: boolean;
  data: {
    conversations: ChatListItem[];
  };
}

export interface ChatMessage {
  id: number;
  sender_id: string;
  sender_matri_id: string;
  sender_name: string;
  text: string;
  created_at: string;
  read_at: string | null;
}

/** Other participant in the conversation (from GET messages response). */
export interface ChatOtherUser {
  matri_id: string;
  name: string;
  profile_photo: string | null;
  is_online?: boolean;
  last_seen?: string | null;
}

export interface ChatMessagesResponse {
  success: boolean;
  data: {
    conversation_id: number;
    total: number;
    page: number;
    limit: number;
    messages: ChatMessage[];
    other_user?: ChatOtherUser;
  };
}

const CHAT_BASE = "v1/chat";

export async function getChatList(): Promise<ChatListResponse> {
  return authedFetch<ChatListResponse>(`${CHAT_BASE}/list/`, { method: "GET" });
}

function unwrapMessagesBlock(raw: unknown): Record<string, unknown> | null {
  const top = raw as { data?: Record<string, unknown> };
  let block = top?.data;
  if (!block || typeof block !== "object") return null;
  const inner = block.data as Record<string, unknown> | undefined;
  if (inner && Array.isArray(inner.messages)) return inner;
  if (Array.isArray(block.messages)) return block;
  return null;
}

export async function getChatMessages(conversationId: number, page = 1, limit = 50): Promise<ChatMessagesResponse> {
  const path = `${CHAT_BASE}/messages/${conversationId}/?page=${page}&limit=${limit}`;
  const raw = await authedFetch<unknown>(path, { method: "GET" });
  const block = unwrapMessagesBlock(raw);
  const messages = (block?.messages as ChatMessage[]) ?? [];
  const ou = block?.other_user as ChatOtherUser | undefined;
  return {
    success: true,
    data: {
      conversation_id: Number(block?.conversation_id) || conversationId,
      total: Number(block?.total) ?? messages.length,
      page: Number(block?.page) || page,
      limit: Number(block?.limit) || limit,
      messages,
      ...(ou && typeof ou === "object" ? { other_user: ou } : {}),
    },
  };
}

/** Build websocket URL from BASE_URL like http://host:8000/api/ → ws://host:8000/ws/chat/{id}/?token=... */
export function buildChatWebSocketUrl(conversationId: number): string | null {
  try {
    const token = useAuthStore.getState().accessToken;
    if (!token) return null;

    const apiUrl = new URL(BASE_URL);
    const isSecure = apiUrl.protocol === "https:";
    const wsProtocol = isSecure ? "wss:" : "ws:";

    // Strip trailing /api/ or /api
    const basePath = apiUrl.pathname.replace(/\/api\/?$/, "") || "";

    const wsUrl = new URL(apiUrl.href);
    wsUrl.protocol = wsProtocol;
    wsUrl.pathname = `${basePath}/ws/chat/${conversationId}/`;
    wsUrl.search = `?token=${encodeURIComponent(token)}`;
    return wsUrl.toString();
  } catch {
    return null;
  }
}

