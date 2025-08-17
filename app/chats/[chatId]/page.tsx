import { ChatView } from "@/components/chat/chat-view";

// Required for static export with dynamic routes
export async function generateStaticParams() {
  // Since this is a chat app with dynamic chat IDs,
  // we can only return empty array or placeholder values
  return [];

  // Or return some placeholder routes:
  // return [
  //   { chatId: 'new' },
  //   { chatId: 'placeholder' }
  // ]
}

interface ChatPageProps {
  params: {
    chatId: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  return <ChatView chatId={params.chatId} />;
}
