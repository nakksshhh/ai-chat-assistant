import { gql } from '@apollo/client'

// Create a new chat
export const CREATE_CHAT = gql`
  mutation CreateChat($title: String!) {
    insert_chats_one(object: {title: $title}) {
      id
      title
      user_id
      created_at
    }
  }
`

// Insert a message directly to database (generic - can be user or bot)
export const INSERT_MESSAGE = gql`
  mutation InsertMessage($chatId: uuid!, $content: String!, $sender: String!) {
    insert_messages_one(object: { 
      chat_id: $chatId, 
      content: $content, 
      sender: $sender 
    }) {
      id
      chat_id
      content
      sender
      created_at
    }
  }
`

// Insert user message specifically
export const INSERT_USER_MESSAGE = gql`
  mutation InsertUserMessage($chatId: uuid!, $content: String!) {
    insert_messages_one(object: { 
      chat_id: $chatId, 
      content: $content, 
      sender: "user" 
    }) {
      id
      chat_id
      content
      sender
      created_at
    }
  }
`

// Insert bot message directly (if needed)
export const INSERT_BOT_MESSAGE = gql`
  mutation InsertBotMessage($chatId: uuid!, $content: String!) {
    insert_messages_one(object: { 
      chat_id: $chatId, 
      content: $content, 
      sender: "bot" 
    }) {
      id
      chat_id
      content
      sender
      created_at
    }
  }
`

// // Hasura Action to trigger bot response via n8n
// export const SEND_MESSAGE_ACTION = gql`
//   mutation SendMessageAction($chatId: uuid!, $content: String!) {
//     sendMessage(chatId: $chatId, content: $content) {
//       success
//       botResponse
//       error
//     }
//   }
// `

export const SEND_MESSAGE_ACTION = gql`
  mutation SendMessageAction($chat_id: uuid!, $content: String!, $userId: uuid!) {
    sendMessage(chat_id: $chat_id, content: $content, userId: $userId) {
      success
      botResponse
      error
    }
  }
`
