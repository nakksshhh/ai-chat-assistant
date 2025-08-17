import { gql } from '@apollo/client'

export const GET_CHATS = gql`
  query GetChats {
    chats(order_by: { created_at: desc }) {
      id
      title
      created_at
      messages_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`

export const GET_CHAT_MESSAGES = gql`
  query GetChatMessages($chatId: uuid!) {
    messages(
      where: { chat_id: { _eq: $chatId } }
      order_by: { created_at: asc }
    ) {
      id
      content
      sender
      created_at
    }
  }
`

export const GET_CHAT = gql`
  query GetChat($chatId: uuid!) {
    chats_by_pk(id: $chatId) {
      id
      title
      created_at
    }
  }
`