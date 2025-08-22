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
}

// Simplified optimistic message type
interface OptimisticMessage {
  id: string;
  content: string;
  sender: "user";
  created_at: string;
  isOptimistic: true;
}

// Simple UUID generator
function generateId() {
  return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function ChatView({ chatId }: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isGeneratingBot, setIsGeneratingBot] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const isSubmittingRef = useRef(false);

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
    // Add this to prevent duplicate subscriptions
    fetchPolicy: 'cache-and-network'
  });

  const [insertUserMessage, { loading: sendingMessage }] = useMutation(INSERT_USER_MESSAGE);
  const userId = useUserId();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Clean up optimistic messages when real messages arrive
  useEffect(() => {
    const serverMessages = messagesData?.messages || [];
    
    setOptimisticMessages(prev => {
      return prev.filter(optMsg => {
        // Remove optimistic message if we find a server message with same content
        // within the last 30 seconds (to account for any delays)
        const cutoffTime = new Date(Date.now() - 30000).toISOString();
        
        return !serverMessages.some(serverMsg => 
          serverMsg.sender === "user" &&
          serverMsg.content.trim() === optMsg.content.trim() &&
          serverMsg.created_at > cutoffTime
        );
      });
    });
  }, [messagesData?.messages]);

  // Combine and deduplicate messages
  const messages = useMemo(() => {
    const serverMessages: MessageType[] = messagesData?.messages || [];
    
    // Simple deduplication for server messages only
    const deduplicatedServer = serverMessages.reduce((acc, message) => {
      // Check if we already have this message (by content and timestamp similarity)
      const isDuplicate = acc.some(existing => 
        existing.content.trim() === message.content.trim() &&
        existing.sender === message.sender &&
        Math.abs(new Date(existing.created_at).getTime() - new Date(message.created_at).getTime()) < 2000
      );
      
      if (!isDuplicate) {
        acc.push(message);
      }
      
      return acc;
    }, [] as MessageType[]);

    // Combine with optimistic messages
    const allMessages = [
      ...deduplicatedServer,
      ...optimisticMessages
    ];

    // Sort by timestamp
    return allMessages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messagesData?.messages, optimisticMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSubmittingRef.current) return;
      
      if (!userId) {
        toast.error("User not authenticated. Please refresh the page.");
        return;
      }

      // Add optimistic message
      const optimisticId = generateId();
      const optimisticMsg: OptimisticMessage = {
        id: optimisticId,
        content: trimmed,
        sender: "user",
        created_at: new Date().toISOString(),
        isOptimistic: true
      };

      setOptimisticMessages(prev => [...prev, optimisticMsg]);

      try {
        isSubmittingRef.current = true;
        setIsGeneratingBot(true);

        // Insert message to database
        await insertUserMessage({
          variables: { chatId, content: trimmed },
          fetchPolicy: "no-cache",
        });

        // Trigger backend workflow
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
        console.error("Send error:", err);
        
        // Remove the failed optimistic message
        setOptimisticMessages(prev => 
          prev.filter(msg => msg.id !== optimisticId)
        );
        
        toast.error("Failed to send message. Please try again.");
      } finally {
        setIsGeneratingBot(false);
        isSubmittingRef.current = false;
      }
    },
    [chatId, userId, insertUserMessage]
  );

  // Prevent rapid successive calls
  const lastCallRef = useRef(0);
  const debouncedSendMessage = useCallback(
    (content: string) => {
      const now = Date.now();
      if (now - lastCallRef.current < 500) return;
      lastCallRef.current = now;
      handleSendMessage(content);
    },
    [handleSendMessage]
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
      <MessageInput onSend={debouncedSendMessage} disabled={sendingMessage || isGeneratingBot} />
    </div>
  );
}