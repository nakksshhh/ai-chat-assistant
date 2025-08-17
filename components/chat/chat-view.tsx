// 'use client'

// import { useQuery, useMutation, useSubscription } from '@apollo/client'
// import { useUserId } from '@nhost/nextjs'
// import { GET_CHAT } from '@/lib/graphql/queries'
// import { INSERT_USER_MESSAGE, SEND_MESSAGE_ACTION } from '@/lib/graphql/mutations'

// import { MESSAGES_SUBSCRIPTION } from '@/lib/graphql/subscriptions'
// import { Message } from './message'
// import { MessageInput } from './message-input'
// import { Button } from '@/components/ui/button'
// import { ArrowLeft, Loader2 } from 'lucide-react'
// import Link from 'next/link'
// import { useEffect, useRef, useState } from 'react'
// import { ScrollArea } from '@/components/ui/scroll-area'
// import { toast } from 'sonner'

// interface ChatViewProps {
//   chatId: string
// }

// interface MessageType {
//   id: string
//   content: string
//   sender: 'user' | 'bot'
//   created_at: string
// }

// export function ChatView({ chatId }: ChatViewProps) {
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const [isGeneratingBot, setIsGeneratingBot] = useState(false)

//   const { data: chatData, loading: chatLoading, error: chatError } = useQuery(GET_CHAT, {
//     variables: { chatId }
//   })

//   const { data: messagesData, loading: messagesLoading, error: messagesError } = useSubscription(MESSAGES_SUBSCRIPTION, {
//     variables: { chatId }
//   })

//   const [insertUserMessage, { loading: sendingMessage }] = useMutation(INSERT_USER_MESSAGE)
//   const [sendMessageAction] = useMutation(SEND_MESSAGE_ACTION)
//   const userId = useUserId()
//   console.log("user",userId)

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//   }

//   useEffect(() => {
//     scrollToBottom()
//   }, [messagesData])

//   const handleSendMessage = async (content: string) => {
//     if (!content.trim()) return

//     try {
//       setIsGeneratingBot(true)

//       // 1. Insert user message to database
//       await insertUserMessage({
//         variables: {
//           chatId,
//           content: content.trim()
//         }
//       })

//       // 2. Trigger bot response via Hasura Action
//       const { data } = await sendMessageAction({
//         variables: {
//           chatId,
//           content: content.trim(),
//           userId
//         }
//       })

//       // Handle Action response
//       if (!data?.sendMessage?.success) {
//         const error = data?.sendMessage?.error || 'Bot response failed'

//         if (error.includes('rate') && error.includes('limit')) {
//           toast.error('Bot is busy right now. Please try again in a moment.')
//         } else if (error.includes('Unauthorized')) {
//           toast.error('You do not have permission to send messages to this chat.')
//         } else {
//           toast.error(`Bot error: ${error}`)
//         }

//         console.error('Bot Action error:', error)
//       }

//     } catch (error: any) {
//       console.error('Error sending message:', error)

//       // Handle different error types
//       if (error.message?.includes('rate') || error.message?.includes('429')) {
//         toast.error('Rate limited. Please wait a moment before sending another message.')
//       } else if (error.message?.includes('field') && error.message?.includes('not found')) {
//         toast.error('System configuration error. Please contact support.')
//       } else {
//         toast.error('Failed to send message. Please try again.')
//       }

//       throw error
//     } finally {
//       setIsGeneratingBot(false)
//     }
//   }

//   if (chatLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="flex flex-col items-center gap-4">
//           <Loader2 className="h-8 w-8 animate-spin text-primary" />
//           <p className="text-muted-foreground">Loading chat...</p>
//         </div>
//       </div>
//     )
//   }

//   if (chatError || !chatData?.chats_by_pk) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <p className="text-destructive mb-4">
//             {chatError ? 'Error loading chat' : 'Chat not found'}
//           </p>
//           <Button asChild variant="outline">
//             <Link href="/chats">
//               <ArrowLeft className="h-4 w-4 mr-2" />
//               Back to Chats
//             </Link>
//           </Button>
//         </div>
//       </div>
//     )
//   }

//   const chat = chatData.chats_by_pk
//   const messages: MessageType[] = messagesData?.messages || []

//   return (
//     <div className="flex flex-col h-screen">
//       {/* Header */}
//       <div className="border-b bg-background p-4">
//         <div className="flex items-center gap-3">
//           <Button asChild variant="ghost" size="icon">
//             <Link href="/chats">
//               <ArrowLeft className="h-4 w-4" />
//             </Link>
//           </Button>
//           <div>
//             <h1 className="font-semibold text-lg">{chat.title}</h1>
//             <p className="text-sm text-muted-foreground">
//               {messages.length} messages
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Messages */}
//       <ScrollArea className="flex-1 p-4">
//         {messagesLoading && messages.length === 0 ? (
//           <div className="flex items-center justify-center h-full">
//             <div className="flex flex-col items-center gap-4">
//               <Loader2 className="h-8 w-8 animate-spin text-primary" />
//               <p className="text-muted-foreground">Loading messages...</p>
//             </div>
//           </div>
//         ) : messagesError ? (
//           <div className="flex items-center justify-center h-full">
//             <div className="text-center">
//               <p className="text-destructive mb-2">Error loading messages</p>
//               <p className="text-sm text-muted-foreground">
//                 {messagesError.message}
//               </p>
//             </div>
//           </div>
//         ) : messages.length === 0 ? (
//           <div className="flex items-center justify-center h-full">
//             <div className="text-center">
//               <p className="text-muted-foreground mb-4">No messages yet</p>
//               <p className="text-sm text-muted-foreground">
//                 Start the conversation by sending a message below
//               </p>
//             </div>
//           </div>
//         ) : (
//           <div className="space-y-1">
//             {messages.map((message) => (
//               <Message
//                 key={message.id}
//                 content={message.content}
//                 sender={message.sender}
//                 timestamp={message.created_at}
//               />
//             ))}

//             {/* Bot typing indicator */}
//             {isGeneratingBot && (
//               <div className="flex justify-start mb-4">
//                 <div className="bg-muted rounded-lg px-4 py-3 max-w-xs">
//                   <div className="flex items-center gap-2">
//                     <div className="flex space-x-1">
//                       <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
//                       <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
//                       <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
//                     </div>
//                     <span className="text-sm text-muted-foreground">Bot is typing...</span>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div ref={messagesEndRef} />
//           </div>
//         )}
//       </ScrollArea>

//       {/* Message Input */}
//       <MessageInput
//         onSend={handleSendMessage}
//         disabled={sendingMessage || isGeneratingBot}
//         placeholder={
//           isGeneratingBot
//             ? "Bot is responding..."
//             : sendingMessage
//             ? "Sending..."
//             : "Type your message..."
//         }
//       />
//     </div>
//   )
// }

"use client";

import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { useUserId } from "@nhost/nextjs";
import { GET_CHAT } from "@/lib/graphql/queries";
import { INSERT_USER_MESSAGE } from "@/lib/graphql/mutations";
import { MESSAGES_SUBSCRIPTION } from "@/lib/graphql/subscriptions";
import { Message } from "./message";
import { MessageInput } from "./message-input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot } from "lucide-react";
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

export function ChatView({ chatId }: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isGeneratingBot, setIsGeneratingBot] = useState(false);
  const isSubmittingRef = useRef(false);

  // Add component instance tracking
  const instanceId = useRef(Math.random().toString(36).substring(2, 11));
  console.log(
    `🔄 ChatView instance ${instanceId.current} rendered for chatId: ${chatId}`,
    { isGeneratingBot, isSubmitting: isSubmittingRef.current }
  );

  // Track bot typing state changes
  useEffect(() => {
    console.log(
      `[${instanceId.current}] 🤖 Bot typing state changed:`,
      isGeneratingBot
    );
  }, [isGeneratingBot]);

  const {
    data: chatData,
    loading: chatLoading,
    error: chatError,
  } = useQuery(GET_CHAT, {
    variables: { chatId },
  });

  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
  } = useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: { chatId },
    // Only subscribe when chatId is available
    skip: !chatId,
  });

  const [insertUserMessage, { loading: sendingMessage }] =
    useMutation(INSERT_USER_MESSAGE);

  const userId = useUserId();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Memoized messages with proper deduplication that doesn't persist across subscription updates
  const messages = useMemo(() => {
    const rawMessages: MessageType[] = messagesData?.messages || [];
    console.log(
      `[${instanceId.current}] Raw messages from subscription:`,
      rawMessages.length,
      rawMessages.map((m) => ({
        id: m.id,
        sender: m.sender,
        content: m.content.substring(0, 20),
      }))
    );

    // Deduplicate within this data update only (not across updates)
    const messageMap = new Map<string, MessageType>();
    rawMessages.forEach((message) => {
      messageMap.set(message.id, message);
    });

    const dedupedMessages = Array.from(messageMap.values()).sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    console.log(
      `[${instanceId.current}] Final messages:`,
      dedupedMessages.length,
      dedupedMessages.map((m) => ({
        id: m.id,
        sender: m.sender,
        content: m.content.substring(0, 20),
      }))
    );
    return dedupedMessages;
  }, [messagesData?.messages]);

  // useEffect must be at top level, before any conditional returns
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Option 1: Use n8n workflow via Hasura Action (requires Hasura Action setup)
  const handleSendMessageWithN8n = useCallback(
    async (content: string) => {
      const callId = Math.random().toString(36).substring(2, 11);
      console.log(
        `[${instanceId.current}:${callId}] 🚀 handleSendMessageWithN8n CALLED with: "${content}"`
      );
      console.log(`[${instanceId.current}:${callId}] Current state:`, {
        isSubmitting: isSubmittingRef.current,
        isGeneratingBot,
        sendingMessage,
      });

      if (!content.trim()) {
        console.log(
          `[${instanceId.current}:${callId}] ❌ Empty content, returning`
        );
        return;
      }

      // Prevent double submissions with a more robust check
      if (isSubmittingRef.current) {
        console.log(
          `[${instanceId.current}:${callId}] ❌ Already submitting, ignoring`
        );
        return;
      }

      // Validate userId is available
      if (!userId) {
        console.log(`[${instanceId.current}:${callId}] ❌ No userId available`);
        toast.error("User not authenticated. Please refresh the page.");
        return;
      }

      try {
        console.log(
          `[${instanceId.current}:${callId}] 🔒 Setting submission lock`
        );
        isSubmittingRef.current = true;

        console.log(
          `[${instanceId.current}:${callId}] 🤖 Setting bot typing to TRUE`
        );
        setIsGeneratingBot(true);

        // 1. Insert user message to database
        console.log(
          `[${instanceId.current}:${callId}] 💾 Inserting user message to database`
        );
        const result = await insertUserMessage({
          variables: {
            chatId: chatId,
            content: content.trim(),
          },
          // Prevent Apollo from caching or refetching
          fetchPolicy: "no-cache",
          refetchQueries: [],
          awaitRefetchQueries: false,
        });
        console.log(
          `[${instanceId.current}:${callId}] ✅ User message inserted:`,
          result.data?.insert_messages_one?.id
        );

        // 2. Call n8n workflow via API route
        console.log(`[${instanceId.current}:${callId}] 🌐 Calling n8n API`);
        const response = await fetch("/api/chat/send-message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatId: chatId,
            content: content.trim(),
            userId: userId,
          }),
        });

        const data = await response.json();
        console.log(
          `[${instanceId.current}:${callId}] 📨 n8n API response:`,
          data
        );

        if (data.success) {
          console.log(
            `[${instanceId.current}:${callId}] ✅ Message sent successfully`
          );
          toast.success("Message sent!");
        } else {
          throw new Error(data.error || "Failed to get bot response");
        }
      } catch (error: any) {
        console.error(
          `[${instanceId.current}:${callId}] ❌ Error sending message:`,
          error
        );
        toast.error("Failed to send message. Please try again.");
        throw error;
      } finally {
        console.log(
          `[${instanceId.current}:${callId}] 🧹 Cleaning up - setting bot typing to FALSE`
        );
        setIsGeneratingBot(false);
        isSubmittingRef.current = false;
      }
    },
    [chatId, userId, insertUserMessage, isGeneratingBot, sendingMessage]
  );

  // Add debounce to prevent rapid double calls
  const lastCallTimeRef = useRef(0);

  const debouncedHandleSendMessage = useCallback(
    async (content: string) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTimeRef.current;

      console.log(
        `[${instanceId.current}] 🕐 Time since last call: ${timeSinceLastCall}ms`
      );

      // Prevent calls within 500ms of each other
      if (timeSinceLastCall < 500) {
        console.log(
          `[${instanceId.current}] ⏰ Debouncing call - too soon after last call`
        );
        return;
      }

      lastCallTimeRef.current = now;
      return handleSendMessageWithN8n(content);
    },
    [handleSendMessageWithN8n]
  );

  // Choose which handler to use - now using n8n workflow with debounce
  const handleSendMessage = debouncedHandleSendMessage;

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
              <p className="text-sm text-muted-foreground">
                {messages.length} messages
              </p>
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
              <p className="text-sm text-muted-foreground">
                {messagesError.message}
              </p>
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
                      <span className="text-sm text-muted-foreground">
                        Bot is thinking...
                      </span>
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
      <MessageInput
        onSend={handleSendMessage}
        disabled={sendingMessage || isGeneratingBot}
      />
    </div>
  );
}
