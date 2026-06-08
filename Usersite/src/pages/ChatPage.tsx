"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Sparkles, Smile, Lock, User } from "lucide-react";
import { toast } from "sonner";
import {
  buildChatWebSocketUrl,
  getChatMessages,
  type ChatMessage,
  type ChatOtherUser,
} from "@/lib/chatApi";
import { useAuthStore } from "@/stores/authStore";
import { BASE_URL } from "@/lib/config";
import { parseApiDate } from "@/lib/utils";

function chatParticipantPhotoUrl(photo: string | null | undefined): string {
  if (!photo?.trim()) return "";
  const p = photo.trim();
  if (/^https?:\/\//i.test(p)) return p;
  const base = BASE_URL.replace(/\/api\/?$/i, "").replace(/\/$/, "");
  return `${base}${p.startsWith("/") ? "" : "/"}${p}`;
}

function formatLastSeen(value: string): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const d = parseApiDate(raw);
  if (!d) return raw; // API might already send "10 minutes ago"
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Client-only temp ids (negative). Dropped when the server echoes the same outgoing text. */
const nextOptimisticMessageId = (seq: { current: number }) => {
  seq.current += 1;
  return -seq.current;
};

const ChatPage = () => {
  const params = useParams();
  const profileId = (params?.profileId as string | undefined) ?? undefined;
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const optimisticIdSeqRef = useRef(0);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  /** Header: from GET chat/messages/{id}/ → other_user */
  const [otherUser, setOtherUser] = useState<ChatOtherUser | null>(null);

  const visibleMessages = messages.filter(
    (m) => (m.text ?? "").trim().length > 0,
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages.length]);

  useEffect(() => {
    const idNum = Number(profileId);
    if (!idNum) return;

    let cancelled = false;
    const wsRef = { current: null as WebSocket | null };
    /** IDs already shown (from GET or WS) — skip WS echoes / history replay / double sockets */
    const seenMessageIds = new Set<number>();

    const connect = async () => {
      setLoading(true);
      setError(null);
      setOtherUser(null);
      try {
        const res = await getChatMessages(idNum, 1, 100);
        if (cancelled) return;
        const list = res.data.messages ?? [];
        list.forEach((m) => seenMessageIds.add(m.id));
        setMessages(list);
        if (res.data.other_user) setOtherUser(res.data.other_user);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load messages");
      } finally {
        if (!cancelled) setLoading(false);
      }

      if (cancelled) return;

      const url = buildChatWebSocketUrl(idNum);
      if (!url) return;

      const socket = new WebSocket(url);
      wsRef.current = socket;
      setWs(socket);

      socket.onmessage = (event) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(event.data) as {
            message_id: number;
            sender_id: string;
            sender_matri_id: string;
            sender_name: string;
            text: string;
            created_at: string;
          };
          const mid = payload.message_id;
          if (seenMessageIds.has(mid)) return;
          seenMessageIds.add(mid);

          const msg: ChatMessage = {
            id: mid,
            sender_id: payload.sender_id,
            sender_matri_id: payload.sender_matri_id,
            sender_name: payload.sender_name,
            text: payload.text,
            created_at: payload.created_at,
            read_at: null,
          };

          const ourMatri = useAuthStore.getState().user?.matriId;
          const echoText = (payload.text ?? "").trim();
          setMessages((prev) => {
            let base = prev;
            if (
              ourMatri &&
              payload.sender_matri_id === ourMatri &&
              echoText.length > 0
            ) {
              const dropIdx = base.findIndex(
                (m) =>
                  m.id < 0 &&
                  m.sender_matri_id === ourMatri &&
                  (m.text ?? "").trim() === echoText,
              );
              if (dropIdx !== -1) {
                base = [...base.slice(0, dropIdx), ...base.slice(dropIdx + 1)];
              }
            }
            return [...base, msg];
          });
        } catch {
          // ignore malformed frames
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
      setWs(null);
    };
  }, [profileId]);

  if (!profileId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <motion.div
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-accent-rose/50 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lock className="w-12 h-12 text-primary" />
            </motion.div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
              Chat Not Available
            </h2>
            <p className="text-muted-foreground mb-6">
              You can only chat with this person once your interest has been
              accepted or you've accepted their interest.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button variant="hero" onClick={() => router.back()}>
                View Profile
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleSendMessage = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    if (ws && ws.readyState === WebSocket.OPEN) {
      const user = useAuthStore.getState().user;
      const matriId = user?.matriId ?? "";
      const optimistic: ChatMessage = {
        id: nextOptimisticMessageId(optimisticIdSeqRef),
        sender_id: (user?.phone || user?.email || "").trim(),
        sender_matri_id: matriId,
        sender_name: user?.name?.trim() || "You",
        text: trimmed,
        created_at: new Date().toISOString(),
        read_at: null,
      };
      setMessages((prev) => [...prev, optimistic]);
      ws.send(JSON.stringify({ message: trimmed }));
      setNewMessage("");
      setEmojiOpen(false);
    } else {
      toast.error("Chat connection is not active. Please try again.");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-romantic flex flex-col">
      {/* Chat Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-soft"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="hover:bg-accent-rose/50"
              >
                <ArrowLeft className="w-5 h-5 text-primary" />
              </Button>

              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  {(() => {
                    const src = chatParticipantPhotoUrl(
                      otherUser?.profile_photo,
                    );
                    const initial = (otherUser?.name ?? "?")
                      .trim()
                      .charAt(0)
                      .toUpperCase();
                    return src ? (
                      <img
                        src={src}
                        alt={otherUser?.name ?? ""}
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 bg-muted"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-primary/20 bg-accent-rose/40 flex items-center justify-center">
                        {loading ? (
                          <User className="w-6 h-6 text-primary/40" />
                        ) : (
                          <span className="text-lg font-bold text-primary/60">
                            {initial}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  {otherUser?.is_online === true && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif font-bold text-foreground truncate">
                    {loading && !otherUser
                      ? "Loading…"
                      : (otherUser?.name ?? "Chat")}
                  </h2>
                  {otherUser && (
                    <p
                      className={
                        otherUser.is_online === true
                          ? "text-xs text-green-600 font-medium"
                          : "text-xs text-muted-foreground"
                      }
                    >
                      {otherUser.is_online === true
                        ? "Online now"
                        : otherUser.last_seen
                          ? `Last seen ${formatLastSeen(otherUser.last_seen)}`
                          : "Offline"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Top-right call / more actions removed as per UI requirement */}
          </div>
        </div>
      </motion.header>

      {/* Messages Area */}
      <div className="flex-1 pt-24 pb-24 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          {/* Date Separator */}
          <div className="flex items-center justify-center mb-6">
            <div className="px-4 py-1.5 bg-white/70 backdrop-blur-sm rounded-full text-xs text-muted-foreground shadow-soft">
              Today
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            <AnimatePresence>
              {visibleMessages.map((message, index) => {
                const isOwn =
                  message.sender_matri_id ===
                  useAuthStore.getState().user?.matriId;
                const messageKey = `${message.id}-${message.created_at}-${index}`;

                return (
                  <motion.div
                    key={messageKey}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[75%] ${isOwn ? "order-2" : ""}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-soft ${
                          isOwn
                            ? "bg-gradient-to-br from-primary to-primary-light text-primary-foreground rounded-br-sm"
                            : "bg-white/90 backdrop-blur-sm text-foreground rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">
                          {message.text}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${isOwn ? "justify-end" : ""}`}
                      >
                        <span>
                          {(() => {
                            const d = parseApiDate(message.created_at);
                            return d ? formatTime(d) : "";
                          })()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {!loading && visibleMessages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No messages yet.
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-primary/5 shadow-elevated"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a message..."
                className="w-full px-4 py-3 bg-accent-rose/30 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-accent-rose/50"
                onClick={() => setEmojiOpen((v) => !v)}
              >
                <Smile className="w-5 h-5 text-muted-foreground" />
              </Button>
              {emojiOpen && (
                <div className="absolute right-0 bottom-12 z-20 w-64 max-h-64 overflow-y-auto rounded-2xl bg-white shadow-elevated border border-primary/10 p-2 grid grid-cols-8 gap-1 text-lg">
                  {[
                    "😀",
                    "😁",
                    "😂",
                    "🤣",
                    "😃",
                    "😄",
                    "😅",
                    "😆",
                    "😉",
                    "😊",
                    "😍",
                    "😘",
                    "😜",
                    "😎",
                    "🙂",
                    "🙃",
                    "🤗",
                    "🤔",
                    "🤨",
                    "😐",
                    "😶",
                    "🙄",
                    "😏",
                    "😣",
                    "😥",
                    "😮",
                    "🤐",
                    "😯",
                    "😪",
                    "😫",
                    "😴",
                    "😌",
                    "🤤",
                    "🤒",
                    "🤕",
                    "🤠",
                    "🥳",
                    "🥰",
                    "❤️",
                    "💖",
                    "💗",
                    "💓",
                    "💞",
                    "💕",
                    "💘",
                    "💝",
                    "👍",
                    "👎",
                    "👏",
                    "🙌",
                    "🙏",
                    "💪",
                    "💃",
                    "🕺",
                    "👋",
                    "🤝",
                    "👀",
                    "👩",
                    "👨",
                    "👫",
                    "💑",
                    "👩‍❤️‍👨",
                  ].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="hover:bg-accent-rose/40 rounded-md leading-none"
                      onClick={() => setNewMessage((prev) => prev + emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="hero"
                size="icon"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="rounded-full w-12 h-12"
              >
                <Send className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Floating Sparkles */}
      {[...Array(3)].map((_, i) => (
        <Sparkles
          key={i}
          className="fixed text-secondary/20 animate-sparkle pointer-events-none"
          style={{
            left: `${20 + i * 30}%`,
            top: `${30 + i * 20}%`,
            width: "24px",
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
};

export default ChatPage;
