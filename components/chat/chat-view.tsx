"use client";

import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { useUserId } from "@nhost/nextjs";
import { GET_CHAT } from "@/lib/graphql/queries";
import { INSERT_USER_MESSAGE } from "@/lib/graphql/mutations";
import { MESSAGES_SUBSCRIPTION } from "@/lib/graphql/subscriptions";
import { Message } from "./message";
import { MessageInput } from "./message-input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Bot, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface ChatViewProps {
  chatId: string;
}

interface MessageType {
  id: string;
  content: string;
  sender: "user" | "bot";
  created_at: string;
  // If available, uncomment these for stronger keys:
  // user_id?: string;
  // chat_id?: string;
}

// Simple UUID without extra deps
function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Compare trimmed content
function sameContent(a?: string, b?: string) {
  return (a || "").trim() === (b || "").trim();
}

// Check two ISO timestamps within a window
function withinWindow(aISO: string, bISO: string, ms: number) {
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  if (!isFinite(a) || !isFinite(b)) return false;
  return Math.abs(a - b) <= ms;
}

// Optimistic message type
type OptimisticMsg = {
  clientId: string;
  content: string;
  created_at: string; // ISO
  sender: "user";
  // user_id?: string; // if available
};

export function ChatView({ chatId }: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isGeneratingBot, setIsGeneratingBot] = useState(false);
  const isSubmittingRef = useRef(false);

  // Per-content queues of optimistic messages for precise reconciliation
  const [optimisticQueues, setOptimisticQueues] = useState<Map<string, OptimisticMsg[]>>(
    () => new Map()
  );

  const instanceId = useRef(Math.random().toString(36).substring(2, 11));
  console.log(`🔄 ChatView ${instanceId.current}`, { chatId });

  const { data: chatData, loading: chatLoading, error: chatError } = useQuery(GET_CHAT, {
    variables: { chatId },
  });

  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
  } = useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: { chatId },
    skip: !chatId,
  });

  const [insertUserMessage, { loading: sendingMessage }] = useMutation(INSERT_USER_MESSAGE);
  const userId = useUserId();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helpers to manage optimistic queues
  const pushOptimistic = useCallback((content: string) => {
    const clientId = uuid();
    const nowISO = new Date().toISOString();
    const entry: OptimisticMsg = {
      clientId,
      content: content.trim(),
      created_at: nowISO,
      sender: "user",
    };

    setOptimisticQueues((prev) => {
      const next = new Map(prev);
      const key = entry.content;
      const q = next.get(key) || [];
      q.push(entry);
      next.set(key, q);
      return next;
    });

    return entry.clientId;
  }, []);

  const popOptimisticIfMatch = useCallback(
    (content: string, serverCreatedAt: string, windowMs = 10000) => {
      setOptimisticQueues((prev) => {
        const next = new Map(prev);
        const key = (content || "").trim();
        const q = next.get(key);
        if (!q || q.length === 0) return prev;

        const sTs = new Date(serverCreatedAt).getTime();
        // Find the earliest optimistic whose time is within the window
        const idx = q.findIndex(
          (o) => Math.abs(new Date(o.created_at).getTime() - sTs) <= windowMs
        );
        if (idx >= 0) {
          q.splice(idx, 1);
          if (q.length === 0) next.delete(key);
          else next.set(key, q);
          return next;
        }
        return prev;
      });
    },
    []
  );

  const flattenOptimistic = useCallback((map: Map<string, OptimisticMsg[]>) => {
    const out: OptimisticMsg[] = [];
    for (const [, q] of map) out.push(...q);
    return out;
  }, []);

  // Reconcile when subscription updates arrive: remove exactly one optimistic per matching server user message
  useEffect(() => {
    const server: MessageType[] = messagesData?.messages || [];
    if (!server.length) return;

    for (const sm of server) {
      if (sm.sender === "user" && sm.content?.trim()) {
        popOptimisticIfMatch(sm.content, sm.created_at, 10000);
      }
    }
  }, [messagesData?.messages, popOptimisticIfMatch]);

  // Compose final message list: server messages + remaining optimistic (with temp ids)
  const messages = useMemo(() => {
    const server: MessageType[] = messagesData?.messages || [];
    const optimisticList = flattenOptimistic(optimisticQueues);

    // TEMP DEBUG: detect potential duplicate server rows (content within 5s)
    (function debugDupes() {
      const userMsgs = server.filter((m) => m.sender === "user");
      const byContent: Record<string, MessageType[]> = {};
      for (const m of userMsgs) {
        const key = (m.content || "").trim();
        (byContent[key] ||= []).push(m);
      }
      for (const [content, arr] of Object.entries(byContent)) {
        if (arr.length > 1) {
          const sorted = arr
            .slice()
            .sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          const closePairs = [];
          for (let i = 0; i < sorted.length - 1; i++) {
            const dt = Math.abs(
              new Date(sorted[i + 1].created_at).getTime() -
                new Date(sorted[i].created_at).getTime()
            );
            if (dt <= 5000) {
              closePairs.push([sorted[i], sorted[i + 1]]);
            }
          }
          if (closePairs.length) {
            console.log(
              "🟡 Potential duplicate SERVER rows for content:",
              content,
              closePairs.map(([a, b]) => ({
                a_id: a.id,
                a_ts: a.created_at,
                b_id: b.id,
                b_ts: b.created_at,
              }))
            );
          }
        }
      }
    })();

    const combined: Array<MessageType | (OptimisticMsg & { id: string })> = [
      ...server,
      ...optimisticList.map((o) => ({
        id: `optimistic:${o.clientId}`,
        content: o.content,
        sender: "user" as const,
        created_at: o.created_at,
      })),
    ];

    // 1) Prefer server over optimistic when near-duplicates exist (1s window)
    const byContentAll: Record<
      string,
      Array<{ id: string; sender: string; created_at: string }>
    > = {};
    for (const m of combined) {
      const key = (m.content || "").trim();
      (byContentAll[key] ||= []).push({
        id: m.id,
        sender: (m as any).sender,
        created_at: m.created_at,
      });
    }

    let keepIds = new Set<string>(combined.map((m) => m.id));
    for (const key of Object.keys(byContentAll)) {
      const arr = byContentAll[key].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      for (let i = 0; i < arr.length - 1; i++) {
        const a = arr[i];
        const b = arr[i + 1];
        const dt = Math.abs(
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        if (dt <= 1000) {
          const isAServer = !a.id.startsWith("optimistic:");
          const isBServer = !b.id.startsWith("optimistic:");
          if (isAServer && !isBServer) keepIds.delete(b.id);
          else if (!isAServer && isBServer) keepIds.delete(a.id);
        }
      }
    }

    // 2) Server-only dedupe: for user messages with identical content within 2s, keep the EARLIER one
    const serverUser = combined.filter(
      (m) => (m as any).sender === "user" && !m.id.startsWith("optimistic:")
    ) as MessageType[];
    const byContentServer: Record<string, Array<{ id: string; created_at: string }>> =
      {};
    for (const m of serverUser) {
      const key = (m.content || "").trim();
      (byContentServer[key] ||= []).push({ id: m.id, created_at: m.created_at });
    }
    for (const key of Object.keys(byContentServer)) {
      const arr = byContentServer[key].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      for (let i = 0; i < arr.length - 1; i++) {
        const a = arr[i];
        const b = arr[i + 1];
        const dt = Math.abs(
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        if (dt <= 2000) {
          // Drop the later one (b) to avoid double server rows
          keepIds.delete(b.id);
        }
      }
    }

    const final = combined.filter((m) => keepIds.has(m.id));
    final.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return final as MessageType[];
  }, [messagesData?.messages, optimisticQueues, flattenOptimistic]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Send handler: push optimistic, insert to DB, trigger backend
  const handleSendMessageWithN8n = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      if (isSubmittingRef.current) return;
      if (!userId) {
        toast.error("User not authenticated. Please refresh the page.");
        return;
      }

      // 1) Optimistic add immediately
      pushOptimistic(trimmed);

      try {
        isSubmittingRef.current = true;
        setIsGeneratingBot(true);

        // 2) Insert user message (server will echo via subscription)
        await insertUserMessage({
          variables: { chatId, content: trimmed },
          fetchPolicy: "no-cache",
          refetchQueries: [],
          awaitRefetchQueries: false,
        });

        // 3) Trigger backend workflow (no backend changes here)
        const resp = await fetch("/api/chat/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, content: trimmed, userId }),
        });
        const json = await resp.json();
        if (!json?.success) {
          throw new Error(json?.error || "Bot response failed");
        }

        toast.success("Message sent!");
      } catch (err) {
        console.error("send error", err);
        // Roll back one optimistic for this content
        setOptimisticQueues((prev) => {
          const next = new Map(prev);
          const key = trimmed;
          const q = next.get(key);
          if (q && q.length) {
            q.pop();
            if (q.length === 0) next.delete(key);
            else next.set(key, q);
          }
          return next;
        });
        toast.error("Failed to send message. Please try again.");
        throw err;
      } finally {
        setIsGeneratingBot(false);
        isSubmittingRef.current = false;
      }
    },
    [chatId, userId, insertUserMessage, pushOptimistic]
  );

  // Debounce to avoid super-fast double send
  const lastCallRef = useRef(0);
  const handleSendMessage = useCallback(
    async (content: string) => {
      const now = Date.now();
      if (now - lastCallRef.current < 400) return;
      lastCallRef.current = now;
      return handleSendMessageWithN8n(content);
    },
    [handleSendMessageWithN8n]
  );

  if (chatLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (chatError || !chatData?.chats_by_pk) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {chatError ? "Error loading chat" : "Chat not found"}
          </p>
          <Button asChild variant="outline">
            <Link href="/chats">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chats
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const chat = chatData.chats_by_pk;

  return (
    <div className="flex flex-col h-screen">
                  {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm p-4 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-1000 delay-200">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="hover:bg-accent/50 transition-all duration-200 group"
            >
              <Link href="/chats">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold text-xl">{chat.title}</h1>
              <p className="text-sm text-muted-foreground">{messages.length} messages</p>
            </div>
          </div>
          <div className="animate-in fade-in slide-in-from-right-4 duration-1000 delay-300">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messagesLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : messagesError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-destructive mb-2">Error loading messages</p>
              <p className="text-sm text-muted-foreground">{messagesError.message}</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                Start the conversation by sending a message below
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <Message
                key={message.id}
                content={message.content}
                sender={message.sender}
                timestamp={message.created_at}
              />
            ))}

            {/* Bot typing indicator */}
            {isGeneratingBot && (
              <div className="flex justify-start mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex gap-3">
                  <Avatar className="h-9 w-9 flex-shrink-0 bg-gradient-to-br from-secondary to-secondary/80 shadow-md shadow-secondary/25">
                    <AvatarFallback className="bg-transparent">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gradient-to-br from-muted to-muted/80 rounded-2xl px-4 py-3 max-w-xs shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">Bot is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <MessageInput onSend={handleSendMessage} disabled={sendingMessage || isGeneratingBot} />
    </div>
  );
}
